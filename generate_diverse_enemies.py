#!/usr/bin/env python3
"""
Generate diverse enemy sprites for Daily Doom
Creates multiple enemy types with proper transparency
"""

import replicate
import os
import requests
from PIL import Image, ImageEnhance, ImageFilter

# Replicate API setup - extract token from dailydoom.txt
with open('/home/claw/Desktop/dailydoom.txt', 'r') as f:
    content = f.read()
    for line in content.split('\n'):
        if 'replicate api token:' in line.lower():
            token = line.split(':')[-1].strip()
            os.environ['REPLICATE_API_TOKEN'] = token
            break

def generate_enemy_sprite(prompt, filename, enhance_red=False):
    """Generate a single enemy sprite with transparency"""
    
    full_prompt = f"{prompt}, pixel art style, anime/manga character, 512x512, transparent background, no border, clean artwork, detailed sprite, Doom-style demon aesthetic, facing forward, menacing pose"
    
    print(f"Generating {filename}...")
    print(f"Prompt: {full_prompt}")
    
    try:
        # Use waifu-diffusion model (proven to work well)
        output = replicate.run(
            "cjwbw/waifu-diffusion:25d2f75ecda0c0bed34c806b7b7add1e7470dac2309d50d2aaf9003b3a4de4c6",
            input={
                "prompt": full_prompt,
                "width": 512,
                "height": 512,
                "num_inference_steps": 30,
                "guidance_scale": 7.5
            }
        )
        
        # Download the image
        if output and len(output) > 0:
            response = requests.get(output[0])
            if response.status_code == 200:
                # Save original
                original_path = f"assets/sprites/enemies/{filename}_original.png"
                with open(original_path, 'wb') as f:
                    f.write(response.content)
                
                # Process for transparency
                img = Image.open(original_path).convert('RGBA')
                
                # Apply color-based transparency (similar to imp processing)
                pixels = img.load()
                transparent_count = 0
                kept_count = 0
                
                for y in range(img.height):
                    for x in range(img.width):
                        r, g, b, a = pixels[x, y]
                        
                        is_enemy_color = False
                        
                        # Red demon colors
                        if r > 100 and r > g + 20 and r > b + 20:
                            is_enemy_color = True
                        
                        # Dark colors (outlines, shadows)
                        elif max(r, g, b) < 80:
                            is_enemy_color = True
                        
                        # Brown/orange colors (varied demon types)
                        elif r > 80 and g > 40 and b < 100:
                            is_enemy_color = True
                        
                        # Green demon variants
                        elif g > 100 and g > r + 20 and g > b + 20:
                            is_enemy_color = True
                        
                        # Purple/blue demon variants  
                        elif b > 100 and b > r + 20 and b > g + 20:
                            is_enemy_color = True
                        
                        # Yellow/orange details
                        elif r > 150 and g > 100 and b < 100:
                            is_enemy_color = True
                            
                        if is_enemy_color:
                            # Enhance red demons if requested
                            if enhance_red and r > g and r > b:
                                r = min(255, int(r * 1.2))  # Boost red
                                pixels[x, y] = (r, g, b, a)
                            kept_count += 1
                        else:
                            pixels[x, y] = (r, g, b, 0)  # Make transparent
                            transparent_count += 1
                
                # Save transparent version
                transparent_path = f"assets/sprites/enemies/{filename}.png"
                img.save(transparent_path)
                
                print(f"✅ {filename}: {kept_count} demon pixels, {transparent_count} transparent")
                print(f"   Saved: {transparent_path}")
                return True
                
            else:
                print(f"❌ Failed to download {filename}")
                return False
        else:
            print(f"❌ No output generated for {filename}")
            return False
            
    except Exception as e:
        print(f"❌ Error generating {filename}: {e}")
        return False

def main():
    """Generate diverse enemy sprites"""
    
    # Ensure directories exist
    os.makedirs('assets/sprites/enemies', exist_ok=True)
    
    # Define enemy types with specific prompts
    enemies = [
        {
            'filename': 'skeleton_warrior',
            'prompt': 'skeletal warrior demon, bone armor, glowing red eyes, dark magic aura',
            'enhance_red': True
        },
        {
            'filename': 'fire_demon',
            'prompt': 'fire demon with flames, molten skin, burning red and orange colors, muscular',
            'enhance_red': True
        },
        {
            'filename': 'shadow_beast',
            'prompt': 'dark shadow beast, purple and black colors, smoky tendrils, menacing claws',
            'enhance_red': False
        },
        {
            'filename': 'cyber_demon',
            'prompt': 'cybernetic demon, metal armor plating, glowing blue circuits, robotic parts',
            'enhance_red': False
        },
        {
            'filename': 'poison_imp',
            'prompt': 'small poison imp, green toxic skin, bubbling acid, sharp teeth and claws',
            'enhance_red': False
        },
        {
            'filename': 'stone_golem',
            'prompt': 'stone golem demon, rock texture, glowing cracks, massive and intimidating',
            'enhance_red': False
        }
    ]
    
    success_count = 0
    
    for enemy in enemies:
        success = generate_enemy_sprite(
            enemy['prompt'], 
            enemy['filename'],
            enemy.get('enhance_red', False)
        )
        if success:
            success_count += 1
        
        print()  # Blank line between generations
    
    print(f"\n🎉 Generated {success_count}/{len(enemies)} enemy sprites successfully!")
    print(f"💰 Estimated cost: ~${success_count * 0.15:.2f}")
    
    if success_count > 0:
        print("\n📁 New enemy sprites available in assets/sprites/enemies/")
        print("🎮 These can now be integrated into the game for enemy variety!")

if __name__ == '__main__':
    main()