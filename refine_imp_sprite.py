#!/usr/bin/env python3
"""
Iterate on the imp sprite until it's perfect for game use
Focus on clean backgrounds and sharp pixel art
"""

import os
import requests
import time
import sys
from pathlib import Path

REPLICATE_API_TOKEN = os.getenv('REPLICATE_API_TOKEN')
if not REPLICATE_API_TOKEN:
    print("❌ Error: Set REPLICATE_API_TOKEN environment variable")
    sys.exit(1)

# Different prompt variations to try
IMP_PROMPTS = [
    "pixel art demon imp sprite, 64x64 pixels, transparent background, sharp clean pixels, no background noise, red demon with small horns, front view, video game character sprite, flat colors, clean edges",
    
    "16-bit video game sprite, small red demon imp, 64x64 resolution, completely transparent background, no artifacts, sharp pixel art style, clean flat colors, front-facing pose, retro game character",
    
    "clean pixel art sprite of red imp demon, 64x64 pixels, alpha channel transparency, no background elements, sharp edges, flat red coloring, small horns, video game character sheet style",
    
    "game sprite: red demon imp character, pixel art style, 64x64 size, PNG with transparency, clean background removal, sharp pixels only, no noise or artifacts, retro video game art",
    
    "red imp sprite for video game, pixel art, 64x64 pixels, transparent PNG, clean edges, no background clutter, flat colors, demon with horns, front view, game asset quality"
]

def generate_imp_iteration(prompt, iteration_num):
    """Generate one imp iteration"""
    print(f"\n🎨 Iteration {iteration_num}: Testing new prompt...")
    print(f"📝 Prompt: {prompt}")
    
    headers = {
        "Authorization": f"Token {REPLICATE_API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    data = {
        "version": "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        "input": {
            "prompt": prompt,
            "width": 512,
            "height": 512,
            "num_outputs": 1,
            "scheduler": "K_EULER",
            "num_inference_steps": 30,  # More steps for cleaner result
            "guidance_scale": 9.0,      # Higher guidance for better prompt adherence
            "seed": 100 + iteration_num  # Consistent but different seeds
        }
    }
    
    # Start prediction
    response = requests.post("https://api.replicate.com/v1/predictions", 
                           headers=headers, json=data)
    
    if response.status_code == 429:  # Rate limited
        retry_after = response.json().get("retry_after", 15)
        print(f"⏳ Rate limited, waiting {retry_after}s...")
        time.sleep(retry_after + 5)
        return generate_imp_iteration(prompt, iteration_num)  # Retry
        
    if response.status_code != 201:
        print(f"❌ Failed to start: {response.text}")
        return False
    
    prediction = response.json()
    prediction_id = prediction["id"]
    
    print(f"⏳ Generating... (ID: {prediction_id[:8]})")
    
    # Poll for completion
    for attempt in range(60):  # 5 minutes max
        time.sleep(5)
        
        response = requests.get(f"https://api.replicate.com/v1/predictions/{prediction_id}",
                              headers=headers)
        
        if response.status_code != 200:
            continue
            
        prediction = response.json()
        status = prediction["status"]
        
        if status == "succeeded":
            image_url = prediction["output"][0]
            
            # Download and save
            img_response = requests.get(image_url)
            if img_response.status_code == 200:
                filename = f"imp_iteration_{iteration_num:02d}.png"
                output_path = f"/home/claw/.openclaw/workspace/{filename}"
                
                with open(output_path, 'wb') as f:
                    f.write(img_response.content)
                print(f"✅ Saved: {filename}")
                return output_path
                
        elif status == "failed":
            print(f"❌ Failed: {prediction.get('error', 'Unknown error')}")
            return False
            
        elif status == "canceled":
            print(f"❌ Canceled")
            return False
        else:
            if attempt % 6 == 0:  # Every 30 seconds
                print(f"⏳ Status: {status}")
    
    print(f"❌ Timed out")
    return False

def main():
    print("🎨 Refining Imp Sprite - Iterative Generation")
    print(f"🔄 Will try {len(IMP_PROMPTS)} different prompt variations")
    print("🎯 Looking for: clean transparent background, sharp pixels, no noise")
    print()
    
    successful_iterations = []
    
    for i, prompt in enumerate(IMP_PROMPTS, 1):
        print(f"\n{'='*60}")
        result = generate_imp_iteration(prompt, i)
        
        if result:
            successful_iterations.append((i, result, prompt))
            print(f"✅ Iteration {i} complete: {result}")
        else:
            print(f"❌ Iteration {i} failed")
            
        # Pause between iterations to avoid rate limiting
        if i < len(IMP_PROMPTS):
            print("⏳ Pausing before next iteration...")
            time.sleep(12)
    
    print(f"\n{'='*60}")
    print(f"🎯 Refinement Complete!")
    print(f"✅ Successful iterations: {len(successful_iterations)}")
    
    if successful_iterations:
        print(f"\n📁 Generated sprites:")
        for i, path, prompt in successful_iterations:
            filename = path.split('/')[-1]
            print(f"  {i}: {filename}")
            print(f"     Prompt: {prompt[:60]}...")
            
        print(f"\n🚀 Review the iterations and pick the best one!")
        print(f"   (Files saved to workspace directory)")
    else:
        print("❌ No successful iterations")

if __name__ == "__main__":
    main()