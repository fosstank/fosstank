group "default" {
    targets = ["origin", "uplink"]
}

target "origin" {
    tags= ["ghcr.io/fosstank/origin:latest"]
    context = "origin"
    contexts = {
        ui = "origin/ui"
    }
}

target "uplink" {
    tags= ["ghcr.io/fosstank/uplink:latest"]
    context = "uplink"
    contexts = {
        ui = "uplink/ui"
    }
}