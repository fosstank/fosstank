package main

import (
	"encoding/json"
	"io"
	"net/http"
	"os"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/webhook"
)

var sc *stripe.Client
var SECRET_KEY = os.Getenv("STRIPE_SECRET_KEY")
var WEBHOOK_SIGNING_SECRET = os.Getenv("STRIPE_WEBHOOK_SIGNING_SECRET")

func init() {
	if SECRET_KEY == "" {
		app.Logger().Warn("STRIPE_SECRET_KEY env var is not set, stripe integration will be disabled")
		return
	}

	if WEBHOOK_SIGNING_SECRET == "" {
		app.Logger().Warn("STRIPE_WEBHOOK_SIGNING_SECRET env var is not set, stripe integration will be disabled")
		return
	}

	sc = stripe.NewClient(SECRET_KEY)

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		g := se.Router.Group("/api/stripe")
		checkoutRoute := g.POST("/checkout", checkoutHandler)
		checkoutRoute.Bind(apis.RequireAuth("users"))
		g.POST("/fulfill-checkout", fulfillCheckoutHandler)
		return se.Next()
	})
}

func checkoutHandler(e *core.RequestEvent) error {
	body, err := io.ReadAll(e.Request.Body)
	if err != nil {
		return apis.NewApiError(http.StatusBadRequest, "Failed to read request body", err)
	}

	data := struct {
		StripePriceID string `json:"stripe_price_id"`
		TokenBundleID string `json:"token_bundle_id"`
	}{}
	if err := json.Unmarshal(body, &data); err != nil {
		return apis.NewApiError(http.StatusBadRequest, "Failed to parse request body", err)
	}

	if data.StripePriceID == "" {
		return apis.NewApiError(http.StatusBadRequest, "stripe_price_id is required", nil)
	}

	if data.TokenBundleID == "" {
		return apis.NewApiError(http.StatusBadRequest, "token_bundle_id is required", nil)
	}

	session, err := sc.V1CheckoutSessions.Create(e.Request.Context(), &stripe.CheckoutSessionCreateParams{
		UIMode:             stripe.String("embedded"),
		PaymentMethodTypes: stripe.StringSlice([]string{"card"}), // add more payment methods if needed
		Mode:               stripe.String("payment"),
		LineItems: []*stripe.CheckoutSessionCreateLineItemParams{
			{
				Price:    stripe.String(data.StripePriceID),
				Quantity: stripe.Int64(1),
			},
		},
		RedirectOnCompletion: stripe.String("never"),
		Metadata: map[string]string{
			"user_id":         e.Auth.Id,
			"token_bundle_id": data.TokenBundleID,
		},
	})
	if err != nil {
		return apis.NewApiError(http.StatusInternalServerError, "Failed to create checkout session", err)
	}

	return e.JSON(http.StatusOK, map[string]any{
		"id":            session.ID,
		"client_secret": session.ClientSecret,
	})
}

func fulfillCheckoutHandler(e *core.RequestEvent) error {
	payload, err := io.ReadAll(e.Request.Body)
	if err != nil {
		return apis.NewApiError(http.StatusBadRequest, "Failed to read request body", err)
	}

	sigHeader := e.Request.Header.Get("Stripe-Signature")
	event, err := webhook.ConstructEvent(payload, sigHeader, WEBHOOK_SIGNING_SECRET)
	if err != nil {
		return apis.NewApiError(http.StatusBadRequest, "Failed to verify webhook signature", err)
	}

	if event.Type == stripe.EventTypeCheckoutSessionCompleted || event.Type == stripe.EventTypeCheckoutSessionAsyncPaymentSucceeded {
		var cs stripe.CheckoutSession
		err := json.Unmarshal(event.Data.Raw, &cs)
		if err != nil {
			return apis.NewApiError(http.StatusBadRequest, "Failed to parse webhook JSON", err)
		}
		err = fulfillCheckout(&cs)
		if err != nil {
			return err
		}
	}

	return e.NoContent(http.StatusOK)
}

func fulfillCheckout(cs *stripe.CheckoutSession) error {
	if cs.PaymentStatus == stripe.CheckoutSessionPaymentStatusUnpaid {
		return nil // don't fulfill unpaid orders
	}

	tokenBundleOrders, err := app.FindRecordsByFilter("token_bundle_orders", "stripe_session_id = {:stripe_session_id}", "", 1, 0, dbx.Params{
		"stripe_session_id": cs.ID,
	})
	if err != nil {
		return apis.NewInternalServerError("Failed to query token bundle orders", err)

	}

	if len(tokenBundleOrders) != 0 {
		return nil // already fulfilled
	}

	// If we get this far, no token bundle order found, we haven't fulfilled this order yet
	tokenBundle, err := app.FindRecordById("token_bundles", cs.Metadata["token_bundle_id"])
	if err != nil {
		return apis.NewBadRequestError("Failed to query token bundle", err)
	}

	user, err := app.FindRecordById("users", cs.Metadata["user_id"])
	if err != nil {
		return apis.NewBadRequestError("No user found for user ID", err)
	}

	err = app.RunInTransaction(func(txApp core.App) error {
		user.Set("balance+", tokenBundle.GetInt("tokens"))
		err = txApp.Save(user)
		if err != nil {
			return apis.NewInternalServerError("Failed to update user balance", err)
		}

		tokenBundleOrderCollection, err := txApp.FindCollectionByNameOrId("token_bundle_orders")
		if err != nil {
			return apis.NewInternalServerError("Failed to find token bundle order collection", err)
		}

		// create a token bundle order record to track this purchase
		order := core.NewRecord(tokenBundleOrderCollection)
		order.Set("user", user.Id)
		order.Set("token_bundle", tokenBundle.Id)
		order.Set("stripe_session_id", cs.ID)
		err = txApp.Save(order)
		if err != nil {
			return apis.NewInternalServerError("Failed to create token bundle order", err)
		}
		return nil
	})
	if err != nil {
		return apis.NewBadRequestError("Error fulfilling token bundle order", err)
	}
	return nil
}
