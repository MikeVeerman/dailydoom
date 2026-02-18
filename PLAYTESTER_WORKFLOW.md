# Daily Doom Playtester Workflow

## 🎯 **Integration with Development Process**

### **After Every Major Change:**
```bash
cd /home/claw/dailydoom/playtester
DAILYDOOM_URL=https://mikeveerman.github.io/dailydoom node run-tests.js
```

### **Expected Output:**
```
DailyDoom Playtester
Target: https://mikeveerman.github.io/dailydoom
Tests:  15

✓ T1-01: Page loads without console errors
✓ T1-02: Canvas is present and non-zero size — Canvas size: 802x602
✓ T1-03: HUD renders correctly
✓ T1-04: Player spawns at expected position — Player at (160, 160)
✓ T1-05: Render loop is running — FPS: 25
✓ T1-06: Player movement works — Moved from (160, 160) to (408, 160)
✓ T1-07: Player rotation works — Rotated from 0° to 175°
✓ T1-08: Canonical screenshot — Screenshot saved to screenshots/latest.png
✓ T1-09: FPS above minimum threshold — FPS: 29 (threshold: 20)
✓ T2-01: Sprites render without errors — Sprite system loaded successfully
✓ T2-02: Enemy AI responds to player — 5/5 enemies active with AI
✓ T2-03: Weapon switching works — Switched from pistol to shotgun
✓ T2-04: Audio system initializes — Audio system ready (initialized: true)
✓ T2-05: Pickups are collectable — Pickup system active with 6 items
✓ T2-06: Wall textures load — 5/5 textures loaded

Results: 15 passed, 0 failed, 0 skipped
Report:  playtester/report.json
```

## 📊 **Current Baseline Expectations**

### **Performance Metrics:**
- **FPS:** 25-30 (threshold: ≥20)
- **Load Time:** <30 seconds for full initialization
- **Canvas Size:** 802x602 optimal

### **Feature Validation:**
- **Enemy Count:** 5/5 active with AI
- **Texture Count:** 5/5 loaded successfully  
- **Pickup Count:** 6 active items
- **Audio System:** Fully initialized
- **Weapon Switching:** Pistol ↔ Shotgun working

## 🔧 **Adding New Tier 2 Tests**

### **When to Add Tests:**
- New major feature implemented
- Bug fix that should be regression-tested
- Performance improvement that needs monitoring
- UI/UX change that affects player interaction

### **Template for New Test:**
```javascript
async function T2_XX_featureName(page, result) {
  // T2-XX: Feature description (issue: #XX)
  // Pass condition: Specific measurable criteria
  await page.waitForTimeout(1000);

  const featureData = await page.evaluate(() => {
    // Check if feature exists and works
    return {
      exists: typeof window.game.newFeature !== 'undefined',
      working: window.game.newFeature.status === 'ready'
    };
  });

  if (!featureData.exists) {
    result.status = 'fail';
    result.note = 'Feature not found';
  } else if (!featureData.working) {
    result.status = 'fail';
    result.note = 'Feature exists but not working';
  } else {
    result.status = 'pass';
    result.note = 'Feature working correctly';
  }
}
```

### **Add to TIER_2_TESTS Array:**
```javascript
{ id: 'T2-XX', name: 'Feature description', fn: T2_XX_featureName }, // issue: #XX
```

## 🚀 **Autonomous Development Integration**

### **Claude CLI Integration:**
```bash
cd /home/claw/dailydoom && claude -p "Make this change: [DESCRIPTION]

After implementation:
1. Commit the changes
2. Push to GitHub  
3. Wait 2 minutes for deployment
4. Run: cd playtester && DAILYDOOM_URL=https://mikeveerman.github.io/dailydoom node run-tests.js
5. Analyze results and report status
6. If tests fail, debug and fix issues
7. If tests pass, document success

Use --dangerously-skip-permissions flag for all operations." --model opus --dangerously-skip-permissions
```

### **Expected Workflow:**
1. **Implement Feature** → Code changes
2. **Commit & Push** → GitHub deployment
3. **Wait for Deploy** → ~2 minutes
4. **Run Playtester** → Automated validation
5. **Analyze Results** → Pass/fail decision
6. **Fix Issues** → If any tests fail
7. **Document Success** → If all tests pass

## 📈 **Regression Detection**

### **Visual Regression:**
- Screenshots saved to `playtester/screenshots/latest.png`
- Previous run saved as `previous.png`
- Manual comparison when visual changes expected

### **Performance Regression:**
- FPS monitoring with 20 FPS threshold
- Load time tracking
- Console error detection

### **Feature Regression:**
- All Tier 1 tests must always pass
- Tier 2 tests validate specific features
- New features should not break existing ones

## 🎯 **Success Criteria**

### **For New Features:**
- All existing tests continue to pass
- New Tier 2 test added for the feature
- Performance within acceptable ranges
- No new console errors introduced

### **For Bug Fixes:**
- Specific regression test added
- All tests pass including the new one
- Performance maintained or improved

### **For Optimizations:**
- All tests pass
- Performance metrics improved
- No functional regressions

## 🔍 **Debugging Failed Tests**

### **Common Failures:**

**T1-05 (Render loop not running):**
- Check for JavaScript errors
- Verify game initialization
- Check canvas element creation

**T2-02 (Enemy AI not responding):**
- Verify enemy spawn code
- Check AI system initialization
- Confirm enemy state management

**T2-06 (Textures not loading):**
- Check texture file paths
- Verify texture loading system
- Monitor network requests for assets

### **Debug Commands:**
```bash
# Run with verbose browser logging
cd playtester && DEBUG=1 DAILYDOOM_URL=https://mikeveerman.github.io/dailydoom node run-tests.js

# Check deployment status
curl -I https://mikeveerman.github.io/dailydoom

# Verify GitHub Pages deployment
gh api repos/MikeVeerman/dailydoom/pages
```

## 🎮 **Integration Success**

**Current Status: FULLY OPERATIONAL**
- 15/15 tests passing
- Comprehensive feature coverage
- Automated regression prevention
- Ready for autonomous development

This playtester system provides the confidence needed for rapid autonomous development while ensuring quality and preventing regressions!