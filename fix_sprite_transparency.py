#!/usr/bin/env python3
"""
Fix Demon Sprite Transparency
Remove gray background from imp sprite and make it truly transparent
"""

from PIL import Image
import os

def make_sprite_transparent(input_path, output_path, background_color_range=None):
    """
    Make sprite background transparent by removing specific background colors
    
    Args:
        input_path: Path to input PNG file
        output_path: Path to output PNG file with transparency
        background_color_range: RGB range to consider as background (optional)
    """
    print(f"Loading sprite: {input_path}")
    
    # Load the image in RGBA mode
    img = Image.open(input_path).convert("RGBA")
    width, height = img.size
    
    print(f"Image size: {width}x{height}")
    
    # Get pixel data
    pixels = img.load()
    
    # Define background colors to make transparent (gray shades)
    background_colors = [
        (64, 64, 64),   # Dark gray
        (65, 65, 65),   # Slightly lighter
        (63, 63, 63),   # Slightly darker
        (66, 66, 66),   # Variations
        (62, 62, 62),
        (67, 67, 67),
        (61, 61, 61),
        (68, 68, 68),
        (60, 60, 60),   # Range of gray background colors
        (69, 69, 69),
        (70, 70, 70),
    ]
    
    transparent_pixels = 0
    total_pixels = width * height
    
    # Make background pixels transparent
    for x in range(width):
        for y in range(height):
            r, g, b, a = pixels[x, y]
            
            # Check if pixel is a background gray color
            if (r, g, b) in background_colors:
                pixels[x, y] = (r, g, b, 0)  # Make transparent
                transparent_pixels += 1
            # Also handle very dark grays (threshold approach)
            elif r < 75 and g < 75 and b < 75 and abs(r - g) < 10 and abs(g - b) < 10:
                pixels[x, y] = (r, g, b, 0)  # Make transparent
                transparent_pixels += 1
    
    print(f"Made {transparent_pixels}/{total_pixels} pixels transparent ({transparent_pixels/total_pixels*100:.1f}%)")
    
    # Save the result
    img.save(output_path, "PNG")
    print(f"Saved transparent sprite: {output_path}")

if __name__ == "__main__":
    input_file = "assets/sprites/imp_transparent.png"
    output_file = "assets/sprites/imp_fixed_transparent.png"
    
    if not os.path.exists(input_file):
        print(f"Error: Input file {input_file} not found!")
        exit(1)
    
    make_sprite_transparent(input_file, output_file)
    print("✅ Sprite transparency fix complete!")