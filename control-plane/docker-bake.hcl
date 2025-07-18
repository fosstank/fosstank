context "ui" {
    path = "ui"
}

target "control-plane" {
    tags= ["control-plane:latest"]
    contexts = {
        ui = "ui"
    }
}