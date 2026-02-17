# Sprite Generation Guide

## 🎨 Generating Initial Sprites

**Cost: ~$1.50-2.00 total** (10 carefully selected sprites)

### Quick Setup

1. **Get Replicate API token:**
   - Go to https://replicate.com/account/api-tokens  
   - Create account (free)
   - Generate API token

2. **Run setup:**
   ```bash
   ./setup_sprite_generation.sh
   export REPLICATE_API_TOKEN='your_token_here'
   ```

3. **Generate sprites:**
   ```bash
   ./generate_sprites.py
   ```

### What Gets Generated

**Enemies (3 sprites):**
- Imp demon (red, horned)
- Zombie soldier (gray, military)  
- Large demon (big red monster)

**Weapons (3 sprites):**
- Pistol (first-person view)
- Shotgun (double barrel)
- Assault rifle (black, military)

**Items & Effects (4 sprites):**
- Health pack (red cross)
- Ammo box (military crate)
- Muzzle flash (weapon fire effect)
- Blood splatter (hit effect)

### Safety Features

✅ **Fixed sprite count** - exactly 10 sprites, no more  
✅ **Cost estimation** - shows expected cost upfront  
✅ **Manual confirmation** - asks before spending money  
✅ **Progress tracking** - shows success/failure per sprite  
✅ **Timeout protection** - won't run forever if stuck  

### After Generation

Sprites will be saved to:
```
assets/
├── sprites/
│   ├── enemies/
│   │   ├── imp_idle.png
│   │   ├── zombie_idle.png
│   │   └── demon_idle.png
│   ├── weapons/
│   │   ├── pistol_idle.png
│   │   ├── shotgun_idle.png
│   │   └── rifle_idle.png
│   └── items/
│       ├── health_pack.png
│       └── ammo_box.png
```

The night shift AI will automatically integrate these into the game code!

## 🌙 Night Shift Integration

Once sprites exist, my nightly cron job will:

1. **Detect new sprites** in assets/ directory
2. **Update sprite loader** in game engine  
3. **Replace colored rectangles** with actual sprites
4. **Add sprite scaling** and positioning
5. **Blog about the process** with humor
6. **Commit everything** to repo

## 🎯 Demo Impact

**Before sprites:** "It's a technical demo with colored blocks"  
**After sprites:** "Holy shit, it's an actual retro game!"

Engineers will see the visual transformation happen overnight - perfect demo narrative of AI doing both technical AND creative work autonomously.

---

*Generated sprites will have that chunky, pixelated Doom aesthetic perfect for the retro vibe!* 🎮