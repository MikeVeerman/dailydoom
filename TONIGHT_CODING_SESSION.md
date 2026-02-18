# 🌙 Tonight's Coding Session - February 18, 2026

## 🎯 **Development Queue: 4 Critical Issues**

### **Priority 1: Issue #14 - Demons Float Above Crosshair (CRITICAL)**
- **Problem**: Red demons render in upper screen, impossible to hit with crosshair-level weapons
- **File**: `js/engine/renderer.js` - `renderSprite()` method
- **Fix**: Adjust sprite Y-positioning to align with crosshair level (`this.halfHeight`)
- **Test**: Verify weapon raycast can hit repositioned demons
- **Impact**: Breaks core combat gameplay - highest priority

### **Priority 2: Issue #16 - GitHub Pages Cache Busting (HIGH)**
- **Problem**: Visitors get stale JS/CSS after deployments due to CDN caching
- **Solution**: Implement commit SHA cache busting (`?v=${GITHUB_SHA::7}`)
- **Files**: `.github/workflows/`, `index.html`, possibly `package.json`
- **Implementation**: GitHub Action to auto-update asset URLs on deploy
- **Impact**: Affects all future deployments and user experience

### **Priority 3: Issue #15 - Sprites Through Walls (HIGH)**
- **Problem**: X-ray vision - demons/pickups visible through walls
- **File**: `js/engine/renderer.js` - `renderSprites()` method  
- **Fix**: Add ray-casting occlusion testing before sprite rendering
- **Algorithm**: Cast ray from player to sprite, skip if walls intersect
- **Impact**: Major visual quality and 3D immersion issue

### **Priority 4: Issue #13 - HUD Intermittent Rendering (HIGH)**
- **Problem**: Canvas context interference causes missing HUD elements
- **File**: `js/ui/hud.js`, `js/engine/game.js`
- **Investigation**: Race conditions, browser-specific rendering issues
- **Fix**: Enhanced canvas state management, render order guarantees
- **Impact**: Affects gameplay readability intermittently

## 🔧 **Development Approach**

### **Session Structure**
1. **Combat Fix First** - Unblocks gameplay testing for other fixes
2. **Cache Busting** - Infrastructure improvement affects all changes
3. **Wall Occlusion** - Visual quality enhancement 
4. **HUD Polish** - Reliability improvement

### **Success Metrics**
- ✅ All 4 GitHub issues resolved and closed
- ✅ Automated test suite passes (19+ tests)
- ✅ AI vision validation confirms fixes
- ✅ Performance maintained (20+ FPS)
- ✅ No regressions in existing systems

### **Testing Strategy**
- **Per-issue testing**: Validate each fix individually
- **Integration testing**: Ensure all systems work together
- **Vision validation**: Claude AI confirms visual improvements
- **Performance testing**: Maintain FPS benchmarks

## 📝 **Documentation Requirements**
- Update commit messages with issue references
- Add technical comments for complex fixes
- Update README if workflow changes
- Close GitHub issues with solution summaries

## 🎮 **Expected Outcomes**
**Post-Session Game State:**
- ✅ Demons positioned at crosshair level (hittable)
- ✅ Fresh deployments always serve latest code  
- ✅ Sprites properly occluded by walls
- ✅ HUD consistently renders across sessions
- ✅ Professional, polished FPS experience

**Ready for autonomous overnight development! 🚀**