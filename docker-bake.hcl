group "default" {
    targets = ["origin", "uplink", "tts"]
}

target "origin" {
    tags= ["ghcr.io/fosstank/origin:latest"]
    context = "origin"
}

target "uplink" {
    tags= ["ghcr.io/fosstank/uplink:latest"]
    context = "uplink"
    contexts = {
        ui = "uplink/ui"
    }
}

target "tts" {
    tags= ["ghcr.io/fosstank/tts:latest"]
    context = "tts"
}