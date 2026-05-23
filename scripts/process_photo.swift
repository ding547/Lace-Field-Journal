import Foundation
import ImageIO
import UniformTypeIdentifiers

if CommandLine.arguments.count != 5 {
    fputs("Usage: process_photo.swift source destination maxEdge quality\n", stderr)
    exit(2)
}

let source = URL(fileURLWithPath: CommandLine.arguments[1])
let destination = URL(fileURLWithPath: CommandLine.arguments[2])
let maxEdge = Int(CommandLine.arguments[3]) ?? 2200
let quality = max(1, min(100, Int(CommandLine.arguments[4]) ?? 82))

guard let imageSource = CGImageSourceCreateWithURL(source as CFURL, nil) else {
    fputs("Could not read source image: \(source.path)\n", stderr)
    exit(1)
}

let options: [CFString: Any] = [
    kCGImageSourceCreateThumbnailFromImageAlways: true,
    kCGImageSourceCreateThumbnailWithTransform: true,
    kCGImageSourceThumbnailMaxPixelSize: maxEdge,
]

guard let image = CGImageSourceCreateThumbnailAtIndex(imageSource, 0, options as CFDictionary) else {
    fputs("Could not decode source image: \(source.path)\n", stderr)
    exit(1)
}

let parent = destination.deletingLastPathComponent()
try? FileManager.default.createDirectory(at: parent, withIntermediateDirectories: true)

guard let destinationImage = CGImageDestinationCreateWithURL(
    destination as CFURL,
    UTType.jpeg.identifier as CFString,
    1,
    nil
) else {
    fputs("Could not create destination image: \(destination.path)\n", stderr)
    exit(1)
}

let properties: [CFString: Any] = [
    kCGImageDestinationLossyCompressionQuality: Double(quality) / 100.0,
]

CGImageDestinationAddImage(destinationImage, image, properties as CFDictionary)

if !CGImageDestinationFinalize(destinationImage) {
    fputs("Could not write destination image: \(destination.path)\n", stderr)
    exit(1)
}
