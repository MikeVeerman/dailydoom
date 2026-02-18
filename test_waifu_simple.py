#!/usr/bin/env python3
"""
Simple test of waifu-diffusion for imp sprite generation
"""

import requests
import time
import sys

def test_waifu_generation():
    print("🧪 Simple waifu-diffusion test")
    print("=" * 40)
    
    headers = {
        "Authorization": "Token r8_7RlAjLfn9zHyBufWw9UBhInbRMix1TK0Khb1w",
        "Content-Type": "application/json"
    }
    
    # Simple prompt test
    prompt = "red demon imp, anime style, clean background, simple colors, game sprite"
    
    print(f"📝 Prompt: {prompt}")
    print("🚀 Starting generation...")
    
    data = {
        "version": "25d2f75ecda0c0bed34c806b7b70319a53a1bccad3ade1a7496524f013f48983",
        "input": {
            "prompt": prompt,
            "width": 512,
            "height": 512,
            "num_outputs": 1,
            "num_inference_steps": 30,
            "guidance_scale": 10.0,
            "seed": 123
        }
    }
    
    print("📤 Sending request to Replicate...")
    response = requests.post("https://api.replicate.com/v1/predictions", 
                           headers=headers, json=data)
    
    print(f"📬 Response status: {response.status_code}")
    
    if response.status_code != 201:
        print(f"❌ Error: {response.text}")
        return False
    
    prediction = response.json()
    prediction_id = prediction["id"]
    
    print(f"✅ Started prediction: {prediction_id}")
    print("⏳ Polling for completion...")
    
    for attempt in range(30):  # 2.5 minutes max
        time.sleep(5)
        print(f"   Attempt {attempt + 1}/30...")
        
        response = requests.get(f"https://api.replicate.com/v1/predictions/{prediction_id}",
                              headers=headers)
        
        if response.status_code != 200:
            print(f"   ⚠️  Poll error: {response.status_code}")
            continue
            
        prediction = response.json()
        status = prediction["status"]
        print(f"   Status: {status}")
        
        if status == "succeeded":
            image_url = prediction["output"][0]
            print(f"🎉 Success! Image URL: {image_url}")
            
            # Download
            print("📥 Downloading...")
            img_response = requests.get(image_url)
            if img_response.status_code == 200:
                output_path = "/home/claw/.openclaw/workspace/test_waifu_imp.png"
                with open(output_path, 'wb') as f:
                    f.write(img_response.content)
                print(f"✅ Saved to: {output_path}")
                return True
            else:
                print(f"❌ Download failed: {img_response.status_code}")
                return False
                
        elif status == "failed":
            print(f"❌ Generation failed: {prediction.get('error', 'Unknown error')}")
            return False
            
        elif status == "canceled":
            print(f"❌ Generation canceled")
            return False
    
    print(f"❌ Timeout after {attempt + 1} attempts")
    return False

if __name__ == "__main__":
    success = test_waifu_generation()
    if success:
        print("🎮 Test successful! Waifu-diffusion is working.")
    else:
        print("💥 Test failed!")
    sys.exit(0 if success else 1)