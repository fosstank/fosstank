group "default" {
    targets = ["control-plane"]
}

target "control-plane" {
    tags= ["ghcr.io/fosstank/control-plane:latest"]
    context = "./control-plane"
    contexts = {
        ui = "./control-plane/ui"
    }
}