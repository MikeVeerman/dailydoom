/**
 * Map Theme Definitions
 * Each theme defines a complete 24x24 map with layout, zones, hazards, enemies, items, and more.
 */
const MapThemes = {

    // ==================== THE REACTOR ====================
    reactor: {
        name: 'THE REACTOR',
        grid: [
        //   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,1], // 1
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,0,0,0,1], // 2
            [1,0,0,4,4,4,4,0,0,1,1,1,0,1,1,0,0,0,2,2,2,2,0,1], // 3
            [1,0,0,4,0,0,4,0,0,0,0,0,0,0,0,0,0,0,2,0,0,2,0,1], // 4
            [1,0,0,4,0,0,4,4,0,0,0,0,0,0,0,0,0,0,2,0,0,2,0,1], // 5
            [1,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,2,0,1], // 6
            [1,0,0,4,4,0,4,4,0,1,1,1,0,1,1,0,0,0,2,2,0,2,0,1], // 7
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 8
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 9
            [1,3,3,3,0,3,3,0,0,5,5,5,0,5,5,5,0,0,3,3,0,3,3,1], // 10
            [1,0,0,3,0,0,3,0,0,5,0,0,0,0,0,5,0,0,3,0,0,0,3,1], // 11
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 12
            [1,0,0,3,0,0,3,0,0,5,0,0,0,0,0,5,0,0,3,0,0,0,3,1], // 13
            [1,0,0,3,0,0,3,0,0,5,0,0,0,0,0,5,0,0,3,0,0,0,3,1], // 14
            [1,3,3,3,0,3,3,0,0,5,5,5,0,5,5,5,0,0,3,3,0,3,3,1], // 15
            [1,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1], // 16
            [1,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,1], // 17
            [1,6,6,6,6,6,6,0,0,1,1,1,0,1,1,1,0,0,1,1,1,1,1,1], // 18
            [1,6,0,0,0,0,6,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,1], // 19
            [1,6,0,0,0,0,6,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,1], // 20
            [1,6,0,0,0,0,6,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1], // 21
            [1,6,0,0,0,0,6,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,1], // 22
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]  // 23
        ],
        spawn: { x: 2.5, y: 2.5, angle: 0 },
        zones: [
            { name: 'control', bounds: { x1: 3, y1: 3, x2: 6, y2: 7 }, lightTint: null, audioProfile: 'control', hudColor: [80, 140, 255] },
            { name: 'reactor', bounds: { x1: 9, y1: 10, x2: 15, y2: 15 }, lightTint: { r: 0.15, g: 0.06, b: 0 }, audioProfile: 'reactor', hudColor: [255, 120, 40] },
            { name: 'waste', bounds: { x1: 1, y1: 18, x2: 6, y2: 22 }, lightTint: { r: 0, g: 0.12, b: 0.02 }, audioProfile: 'waste', hudColor: [80, 255, 80] },
            { name: 'cooling_left', bounds: { x1: 1, y1: 10, x2: 6, y2: 15 }, lightTint: { r: 0, g: 0.04, b: 0.14 }, audioProfile: 'cooling', hudColor: [100, 220, 255] },
            { name: 'cooling_right', bounds: { x1: 18, y1: 10, x2: 22, y2: 15 }, lightTint: { r: 0, g: 0.04, b: 0.14 }, audioProfile: 'cooling', hudColor: [100, 220, 255] }
        ],
        defaultZone: { name: 'corridor', lightTint: { r: 0.04, g: 0.03, b: 0.01 }, audioProfile: 'corridor', hudColor: null },
        doors: [
            { x: 4, y: 7, key: 'none' },
            { x: 12, y: 10, key: 'none' },
            { x: 12, y: 15, key: 'none' },
            { x: 20, y: 7, key: 'none' },
            { x: 12, y: 18, key: 'red' },
            { x: 4, y: 18, key: 'none' }
        ],
        acidTiles: [[11,12],[12,11],[13,12],[3,20],[4,20],[3,21],[2,11],[4,14]],
        lavaTiles: [[12,12],[11,11],[20,19],[21,20]],
        enemies: [
            { x: 8, y: 8, type: 'guard' },
            { x: 5, y: 8.5, type: 'imp' },
            { x: 8, y: 5, type: 'exploder' },
            { x: 8, y: 4, type: 'phantom' },
            { x: 12, y: 11, type: 'demon' },
            { x: 11, y: 13, type: 'berserker' },
            { x: 14, y: 11, type: 'imp' },
            { x: 13, y: 14, type: 'guard' },
            { x: 14, y: 13, type: 'exploder' },
            { x: 20, y: 4, type: 'soldier' },
            { x: 20, y: 11, type: 'spitter' },
            { x: 20, y: 20, type: 'shield_guard' },
            { x: 19, y: 8, type: 'sniper' },
            { x: 17, y: 12, type: 'phantom' },
            { x: 4, y: 14, type: 'imp' },
            { x: 4, y: 19, type: 'guard' },
            { x: 21, y: 21, type: 'boss' }
        ],
        items: [
            { x: 4.5, y: 4.5, type: 'ammo' },
            { x: 8.5, y: 8.5, type: 'health' },
            { x: 12.5, y: 12.5, type: 'ammo' },
            { x: 19.5, y: 4.5, type: 'health' },
            { x: 20.5, y: 20.5, type: 'ammo' },
            { x: 3.5, y: 21.5, type: 'health' }
        ],
        barrels: [
            { x: 6.5, y: 9.5 },
            { x: 8.5, y: 12.5 },
            { x: 17.5, y: 5.5 },
            { x: 17.5, y: 6.5 },
            { x: 5.5, y: 16.5 },
            { x: 17.5, y: 20.5 }
        ],
        crates: [
            { x: 5.5, y: 6.5 },
            { x: 14.5, y: 1.5 },
            { x: 4.5, y: 11.5 },
            { x: 8.5, y: 10.5 },
            { x: 10.5, y: 16.5 },
            { x: 20.5, y: 4.5 },
            { x: 3.5, y: 21.5 },
            { x: 20.5, y: 21.5 }
        ],
        secrets: [
            { wallX: 16, wallY: 2, roomX: 16, roomY: 1 },
            { wallX: 1, wallY: 17, roomX: 1, roomY: 16 },
            { wallX: 22, wallY: 17, roomX: 22, roomY: 16 }
        ],
        waveSpawnPoints: [
            { x: 14, y: 8 },
            { x: 4, y: 16 },
            { x: 12, y: 16 },
            { x: 8, y: 12 },
            { x: 20, y: 8 },
            { x: 8, y: 4 },
            { x: 16, y: 12 },
            { x: 4, y: 12 },
            { x: 18, y: 16 },
            { x: 12, y: 4 },
            { x: 4, y: 20 },
            { x: 16, y: 20 }
        ],
        weaponPickups: [
            { type: 'weapon_shotgun', x: 5.5, y: 5.5 },
            { type: 'weapon_rifle', x: 1.5, y: 12.5 },
            { type: 'weapon_rocket', x: 12.5, y: 14.5 },
            { type: 'weapon_chaingun', x: 20.5, y: 11.5 }
        ],
        traps: [
            // Corridor between control room and reactor — plate in hallway, dart from north wall
            { plateX: 12, plateY: 8, dartX: 12, dartY: 7, direction: 'south' },
            // South corridor near waste storage — plate triggers dart from east
            { plateX: 8, plateY: 17, dartX: 9, dartY: 17, direction: 'west' }
        ]
    },

    // ==================== MILITARY BASE ====================
    military: {
        name: 'MILITARY BASE',
        grid: [
        //   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0  perimeter wall
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 1  perimeter road
            [1,0,0,2,2,2,2,0,0,3,3,3,0,3,3,3,0,0,4,4,4,4,0,1], // 2  barracks/armory/command
            [1,0,2,2,0,0,2,0,0,3,0,0,0,0,0,3,0,0,4,0,0,4,0,1], // 3
            [1,0,2,0,0,0,2,0,0,3,0,0,0,0,0,3,0,0,4,0,0,4,0,1], // 4
            [1,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,1], // 5
            [1,0,2,0,0,0,2,0,0,3,0,0,0,0,0,3,0,0,4,0,0,4,0,1], // 6
            [1,0,2,2,0,2,2,0,0,3,3,3,0,3,3,3,0,0,4,4,0,4,0,1], // 7
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 8  main road
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 9  main road
            [1,0,5,5,5,0,5,5,0,1,1,0,1,1,0,0,0,5,5,0,5,5,0,1], // 10 motor pool / storage
            [1,0,5,0,0,0,0,5,0,1,0,0,0,1,0,0,0,5,0,0,0,5,0,1], // 11
            [1,0,5,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,1], // 12
            [1,0,5,0,0,0,0,5,0,1,0,0,0,1,0,0,0,5,0,0,0,5,0,1], // 13
            [1,0,5,5,5,0,5,5,0,1,1,0,1,1,0,0,0,5,5,0,5,5,0,1], // 14
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 15
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 16
            [1,10,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,10,1], // 17 south corridor + secrets
            [1,0,0,0,0,0,0,0,0,2,2,2,0,2,2,2,0,0,3,3,3,3,3,1], // 18
            [1,0,1,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0,3,0,0,0,0,1], // 19 bunker / detention
            [1,0,1,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0,3,0,0,0,0,1], // 20
            [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,0,1], // 21
            [1,0,1,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0,3,0,0,0,0,1], // 22
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]  // 23
        ],
        spawn: { x: 4.5, y: 4.5, angle: 0 },
        zones: [
            { name: 'barracks', bounds: { x1: 2, y1: 2, x2: 6, y2: 7 }, lightTint: { r: 0.06, g: 0.04, b: 0 }, audioProfile: 'corridor', hudColor: [180, 160, 120] },
            { name: 'armory', bounds: { x1: 9, y1: 2, x2: 15, y2: 7 }, lightTint: { r: 0, g: 0.04, b: 0.08 }, audioProfile: 'cooling', hudColor: [120, 160, 200] },
            { name: 'command', bounds: { x1: 18, y1: 2, x2: 22, y2: 7 }, lightTint: { r: 0.02, g: 0.08, b: 0 }, audioProfile: 'control', hudColor: [80, 200, 80] },
            { name: 'motor_pool', bounds: { x1: 2, y1: 10, x2: 7, y2: 14 }, lightTint: { r: 0.08, g: 0.06, b: 0 }, audioProfile: 'reactor', hudColor: [200, 160, 60] },
            { name: 'bunker', bounds: { x1: 9, y1: 18, x2: 15, y2: 22 }, lightTint: { r: 0.04, g: 0, b: 0 }, audioProfile: 'waste', hudColor: [180, 80, 80] }
        ],
        defaultZone: { name: 'yard', lightTint: { r: 0.03, g: 0.04, b: 0.02 }, audioProfile: 'corridor', hudColor: null },
        doors: [
            { x: 4, y: 7, key: 'none' },
            { x: 12, y: 7, key: 'none' },
            { x: 20, y: 7, key: 'none' },
            { x: 5, y: 14, key: 'none' },
            { x: 12, y: 18, key: 'red' },
            { x: 11, y: 10, key: 'none' }
        ],
        acidTiles: [[3,20],[4,20],[5,20],[3,21],[4,21]],
        lavaTiles: [[11,12],[12,11],[12,12]],
        enemies: [
            { x: 5, y: 5, type: 'guard' },
            { x: 12, y: 4, type: 'soldier' },
            { x: 20, y: 4, type: 'soldier' },
            { x: 8, y: 8, type: 'guard' },
            { x: 15, y: 8, type: 'imp' },
            { x: 4, y: 12, type: 'berserker' },
            { x: 11, y: 12, type: 'demon' },
            { x: 20, y: 12, type: 'sniper' },
            { x: 8, y: 16, type: 'phantom' },
            { x: 16, y: 16, type: 'exploder' },
            { x: 12, y: 20, type: 'shield_guard' },
            { x: 20, y: 20, type: 'spitter' },
            { x: 4, y: 20, type: 'guard' },
            { x: 14, y: 12, type: 'imp' },
            { x: 6, y: 9, type: 'exploder' },
            { x: 19, y: 9, type: 'sniper' },
            { x: 21, y: 21, type: 'boss' }
        ],
        items: [
            { x: 4.5, y: 3.5, type: 'ammo' },
            { x: 12.5, y: 5.5, type: 'ammo' },
            { x: 20.5, y: 3.5, type: 'health' },
            { x: 4.5, y: 12.5, type: 'health' },
            { x: 12.5, y: 20.5, type: 'ammo' },
            { x: 20.5, y: 20.5, type: 'health' }
        ],
        barrels: [
            { x: 8.5, y: 1.5 },
            { x: 16.5, y: 9.5 },
            { x: 6.5, y: 15.5 },
            { x: 6.5, y: 16.5 },
            { x: 14.5, y: 16.5 },
            { x: 17.5, y: 20.5 }
        ],
        crates: [
            { x: 5.5, y: 6.5 },
            { x: 12.5, y: 4.5 },
            { x: 20.5, y: 5.5 },
            { x: 4.5, y: 11.5 },
            { x: 12.5, y: 12.5 },
            { x: 19.5, y: 11.5 },
            { x: 4.5, y: 19.5 },
            { x: 20.5, y: 19.5 }
        ],
        secrets: [
            { wallX: 1, wallY: 17, roomX: 1, roomY: 18 },
            { wallX: 22, wallY: 17, roomX: 22, roomY: 18 }
        ],
        waveSpawnPoints: [
            { x: 12, y: 1 },
            { x: 4, y: 8 },
            { x: 20, y: 8 },
            { x: 8, y: 12 },
            { x: 16, y: 12 },
            { x: 4, y: 16 },
            { x: 12, y: 16 },
            { x: 20, y: 16 },
            { x: 8, y: 20 },
            { x: 16, y: 20 }
        ],
        weaponPickups: [
            { type: 'weapon_shotgun', x: 4.5, y: 5.5 },
            { type: 'weapon_rifle', x: 1.5, y: 12.5 },
            { type: 'weapon_rocket', x: 12.5, y: 12.5 },
            { type: 'weapon_chaingun', x: 20.5, y: 11.5 }
        ],
        traps: [
            // Main road ambush — plate mid-road, dart from north
            { plateX: 12, plateY: 9, dartX: 12, dartY: 8, direction: 'south' },
            // South corridor near bunker — plate triggers dart from east wall
            { plateX: 7, plateY: 16, dartX: 8, dartY: 16, direction: 'west' }
        ]
    },

    // ==================== THE CATACOMBS ===================
    catacombs: {
        name: 'THE CATACOMBS',
        grid: [
        //   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0
            [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1], // 1
            [1,0,0,2,0,1,0,2,2,2,0,0,0,2,2,2,0,0,0,1,0,2,0,1], // 2
            [1,0,2,2,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,0,0,2,0,1], // 3
            [1,0,0,0,0,1,0,2,0,0,0,0,0,0,0,2,0,0,0,1,0,0,0,1], // 4
            [1,1,0,1,1,0,0,2,2,0,2,2,0,2,0,2,0,1,1,1,0,1,1,1], // 5
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 6  main tunnel
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 7  main tunnel
            [1,1,0,1,1,1,0,5,5,5,0,5,5,5,0,0,0,1,1,1,0,1,1,1], // 8
            [1,0,0,0,0,0,0,5,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,1], // 9
            [1,0,3,3,0,0,0,5,0,0,0,0,0,5,0,0,0,0,0,3,3,0,0,1], // 10
            [1,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,1], // 11
            [1,0,0,0,0,0,0,5,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,1], // 12
            [1,0,3,0,0,0,0,5,0,0,0,0,0,5,0,0,0,0,0,0,3,0,0,1], // 13
            [1,0,3,3,0,0,0,5,5,0,5,5,5,5,0,0,0,0,0,3,3,0,0,1], // 14
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 15
            [1,1,0,1,0,1,1,0,0,1,1,0,1,1,0,0,1,1,0,1,0,1,1,1], // 16
            [1,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,1], // 17 secrets
            [1,0,1,0,0,0,0,0,0,2,2,2,0,2,2,2,0,0,0,0,0,1,0,1], // 18
            [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,0,1], // 19
            [1,0,1,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,1,0,1], // 20
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 21
            [1,0,1,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,1,0,1], // 22
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]  // 23
        ],
        spawn: { x: 4.5, y: 3.5, angle: 0 },
        zones: [
            { name: 'crypt_north', bounds: { x1: 7, y1: 2, x2: 15, y2: 5 }, lightTint: { r: 0.04, g: 0, b: 0.04 }, audioProfile: 'waste', hudColor: [160, 100, 160] },
            { name: 'crypt_center', bounds: { x1: 7, y1: 8, x2: 13, y2: 14 }, lightTint: { r: 0, g: 0.08, b: 0.02 }, audioProfile: 'reactor', hudColor: [100, 180, 80] },
            { name: 'flooded_left', bounds: { x1: 1, y1: 9, x2: 6, y2: 14 }, lightTint: { r: 0, g: 0.10, b: 0.06 }, audioProfile: 'cooling', hudColor: [60, 200, 140] },
            { name: 'flooded_right', bounds: { x1: 17, y1: 9, x2: 22, y2: 14 }, lightTint: { r: 0, g: 0.10, b: 0.06 }, audioProfile: 'cooling', hudColor: [60, 200, 140] },
            { name: 'tomb', bounds: { x1: 9, y1: 18, x2: 15, y2: 22 }, lightTint: { r: 0.06, g: 0.02, b: 0 }, audioProfile: 'control', hudColor: [180, 120, 60] }
        ],
        defaultZone: { name: 'tunnel', lightTint: { r: 0.02, g: 0.04, b: 0.01 }, audioProfile: 'corridor', hudColor: null },
        doors: [
            { x: 2, y: 5, key: 'none' },
            { x: 9, y: 8, key: 'none' },
            { x: 2, y: 16, key: 'none' },
            { x: 21, y: 16, key: 'none' },
            { x: 12, y: 16, key: 'red' },
            { x: 11, y: 8, key: 'none' }
        ],
        acidTiles: [[3,11],[4,11],[3,12],[4,12],[18,11],[19,11],[18,12],[19,12]],
        lavaTiles: [[10,10],[11,11],[12,10]],
        enemies: [
            { x: 10, y: 3, type: 'guard' },
            { x: 14, y: 4, type: 'imp' },
            { x: 4, y: 6, type: 'guard' },
            { x: 20, y: 6, type: 'phantom' },
            { x: 10, y: 10, type: 'demon' },
            { x: 12, y: 12, type: 'berserker' },
            { x: 4, y: 11, type: 'spitter' },
            { x: 19, y: 11, type: 'sniper' },
            { x: 8, y: 15, type: 'imp' },
            { x: 16, y: 15, type: 'soldier' },
            { x: 12, y: 20, type: 'shield_guard' },
            { x: 4, y: 19, type: 'guard' },
            { x: 20, y: 19, type: 'exploder' },
            { x: 11, y: 7, type: 'exploder' },
            { x: 15, y: 11, type: 'imp' },
            { x: 6, y: 17, type: 'guard' },
            { x: 14, y: 21, type: 'boss' }
        ],
        items: [
            { x: 4.5, y: 4.5, type: 'ammo' },
            { x: 10.5, y: 4.5, type: 'health' },
            { x: 20.5, y: 3.5, type: 'ammo' },
            { x: 10.5, y: 11.5, type: 'health' },
            { x: 4.5, y: 19.5, type: 'ammo' },
            { x: 12.5, y: 21.5, type: 'health' }
        ],
        barrels: [
            { x: 6.5, y: 7.5 },
            { x: 16.5, y: 7.5 },
            { x: 2.5, y: 15.5 },
            { x: 21.5, y: 15.5 },
            { x: 8.5, y: 19.5 },
            { x: 16.5, y: 19.5 }
        ],
        crates: [
            { x: 4.5, y: 1.5 },
            { x: 21.5, y: 1.5 },
            { x: 3.5, y: 11.5 },
            { x: 21.5, y: 11.5 },
            { x: 10.5, y: 9.5 },
            { x: 12.5, y: 13.5 },
            { x: 4.5, y: 21.5 },
            { x: 20.5, y: 21.5 }
        ],
        secrets: [
            { wallX: 1, wallY: 17, roomX: 1, roomY: 18 },
            { wallX: 22, wallY: 17, roomX: 22, roomY: 18 }
        ],
        waveSpawnPoints: [
            { x: 10, y: 3 },
            { x: 4, y: 7 },
            { x: 20, y: 7 },
            { x: 4, y: 11 },
            { x: 19, y: 11 },
            { x: 10, y: 12 },
            { x: 4, y: 17 },
            { x: 20, y: 17 },
            { x: 12, y: 20 },
            { x: 8, y: 15 }
        ],
        weaponPickups: [
            { type: 'weapon_shotgun', x: 5.5, y: 6.5 },
            { type: 'weapon_rifle', x: 1.5, y: 11.5 },
            { type: 'weapon_rocket', x: 14.5, y: 11.5 },
            { type: 'weapon_chaingun', x: 20.5, y: 9.5 }
        ],
        traps: [
            // Main tunnel crossing — plate in tunnel, dart from south wall
            { plateX: 10, plateY: 7, dartX: 10, dartY: 8, direction: 'north' },
            // South passage — plate in corridor, dart from west wall
            { plateX: 4, plateY: 15, dartX: 3, dartY: 15, direction: 'east' }
        ]
    },

    // ==================== THE INFERNO ====================
    inferno: {
        name: 'THE INFERNO',
        grid: [
        //   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 1  entry cavern
            [1,0,0,5,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,5,0,1], // 2
            [1,0,5,5,0,0,0,0,0,2,2,2,0,2,2,2,0,0,0,0,0,5,0,1], // 3  bone corridors
            [1,0,0,0,0,0,0,0,0,2,0,0,0,0,0,2,0,0,0,0,0,0,0,1], // 4
            [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,1], // 5
            [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1], // 6
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 7
            [1,1,0,1,1,1,0,0,5,5,5,0,0,0,5,5,5,0,0,1,1,1,0,1], // 8
            [1,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,5,0,0,0,0,0,0,1], // 9  lava chambers
            [1,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,5,0,0,0,0,0,0,1], // 10
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 11
            [1,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,5,0,0,0,0,0,0,1], // 12
            [1,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,5,0,0,0,0,0,0,1], // 13
            [1,1,0,1,1,1,0,0,5,5,5,0,0,0,5,5,5,0,0,1,1,1,0,1], // 14
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 15
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 16
            [1,10,1,0,0,0,0,0,0,3,3,3,0,3,3,3,0,0,0,0,0,1,10,1], // 17 altar + secrets
            [1,0,0,0,0,0,0,0,0,3,0,0,0,0,0,3,0,0,0,0,0,0,0,1], // 18
            [1,0,0,0,0,1,0,0,0,3,0,0,0,0,0,3,0,0,0,1,0,0,0,1], // 19 throne room
            [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1], // 20
            [1,0,0,0,0,0,0,0,0,3,0,0,0,0,0,3,0,0,0,0,0,0,0,1], // 21
            [1,0,0,0,0,1,0,0,0,3,0,0,0,0,0,3,0,0,0,1,0,0,0,1], // 22
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]  // 23
        ],
        spawn: { x: 2.5, y: 1.5, angle: Math.PI / 2 },
        zones: [
            { name: 'entry_cavern', bounds: { x1: 1, y1: 1, x2: 22, y2: 7 }, lightTint: { r: 0.10, g: 0.02, b: 0 }, audioProfile: 'reactor', hudColor: [255, 80, 40] },
            { name: 'lava_chamber', bounds: { x1: 8, y1: 8, x2: 16, y2: 14 }, lightTint: { r: 0.18, g: 0.06, b: 0 }, audioProfile: 'reactor', hudColor: [255, 100, 20] },
            { name: 'bone_corridor_left', bounds: { x1: 1, y1: 8, x2: 7, y2: 14 }, lightTint: { r: 0.08, g: 0, b: 0 }, audioProfile: 'waste', hudColor: [200, 60, 60] },
            { name: 'bone_corridor_right', bounds: { x1: 17, y1: 8, x2: 22, y2: 14 }, lightTint: { r: 0.08, g: 0, b: 0 }, audioProfile: 'waste', hudColor: [200, 60, 60] },
            { name: 'throne_room', bounds: { x1: 9, y1: 17, x2: 15, y2: 22 }, lightTint: { r: 0.14, g: 0, b: 0.04 }, audioProfile: 'control', hudColor: [220, 40, 80] }
        ],
        defaultZone: { name: 'hellscape', lightTint: { r: 0.06, g: 0.01, b: 0 }, audioProfile: 'corridor', hudColor: null },
        doors: [
            { x: 2, y: 8, key: 'none' },
            { x: 22, y: 8, key: 'none' },
            { x: 2, y: 14, key: 'none' },
            { x: 22, y: 14, key: 'none' },
            { x: 11, y: 8, key: 'none' },
            { x: 12, y: 17, key: 'red' }
        ],
        acidTiles: [[4,4],[5,4],[18,4],[19,4]],
        lavaTiles: [[10,10],[11,10],[12,10],[13,10],[10,11],[13,11],[10,12],[13,12],[10,13],[11,13],[12,13],[13,13],[3,7],[20,7],[3,16],[20,16]],
        enemies: [
            { x: 12, y: 2, type: 'imp' },
            { x: 6, y: 6, type: 'guard' },
            { x: 18, y: 6, type: 'guard' },
            { x: 11, y: 4, type: 'exploder' },
            { x: 4, y: 10, type: 'demon' },
            { x: 20, y: 10, type: 'berserker' },
            { x: 11, y: 10, type: 'spitter' },
            { x: 13, y: 12, type: 'phantom' },
            { x: 4, y: 13, type: 'sniper' },
            { x: 20, y: 13, type: 'soldier' },
            { x: 8, y: 16, type: 'imp' },
            { x: 16, y: 16, type: 'shield_guard' },
            { x: 12, y: 20, type: 'demon' },
            { x: 4, y: 20, type: 'guard' },
            { x: 20, y: 20, type: 'exploder' },
            { x: 10, y: 15, type: 'imp' },
            { x: 12, y: 21, type: 'boss' }
        ],
        items: [
            { x: 3.5, y: 1.5, type: 'ammo' },
            { x: 20.5, y: 1.5, type: 'ammo' },
            { x: 12.5, y: 6.5, type: 'health' },
            { x: 4.5, y: 11.5, type: 'health' },
            { x: 20.5, y: 11.5, type: 'ammo' },
            { x: 12.5, y: 20.5, type: 'health' }
        ],
        barrels: [
            { x: 8.5, y: 7.5 },
            { x: 15.5, y: 7.5 },
            { x: 2.5, y: 11.5 },
            { x: 21.5, y: 11.5 },
            { x: 8.5, y: 15.5 },
            { x: 15.5, y: 15.5 }
        ],
        crates: [
            { x: 6.5, y: 1.5 },
            { x: 17.5, y: 1.5 },
            { x: 2.5, y: 9.5 },
            { x: 21.5, y: 9.5 },
            { x: 11.5, y: 9.5 },
            { x: 12.5, y: 13.5 },
            { x: 4.5, y: 17.5 },
            { x: 19.5, y: 17.5 }
        ],
        secrets: [
            { wallX: 1, wallY: 17, roomX: 1, roomY: 18 },
            { wallX: 22, wallY: 17, roomX: 22, roomY: 18 }
        ],
        waveSpawnPoints: [
            { x: 12, y: 2 },
            { x: 4, y: 6 },
            { x: 20, y: 6 },
            { x: 4, y: 11 },
            { x: 20, y: 11 },
            { x: 11, y: 11 },
            { x: 4, y: 16 },
            { x: 20, y: 16 },
            { x: 12, y: 20 },
            { x: 8, y: 15 }
        ],
        weaponPickups: [
            { type: 'weapon_shotgun', x: 4.5, y: 7.5 },
            { type: 'weapon_rifle', x: 2.5, y: 11.5 },
            { type: 'weapon_rocket', x: 12.5, y: 11.5 },
            { type: 'weapon_chaingun', x: 20.5, y: 11.5 }
        ],
        traps: [
            // Entry cavern corridor — plate in open area, dart from south
            { plateX: 7, plateY: 7, dartX: 7, dartY: 8, direction: 'north' },
            // South passage near altar — plate triggers dart from east
            { plateX: 7, plateY: 16, dartX: 8, dartY: 16, direction: 'west' }
        ]
    },

    // ==================== CRYOGENICS LAB ====================
    cryogenics: {
        name: 'CRYOGENICS LAB',
        grid: [
        //   0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // 0
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 1
            [1,0,0,4,4,4,0,0,0,3,3,3,0,3,3,3,0,0,0,4,4,4,0,1], // 2  research / cryo-chamber
            [1,0,4,4,0,4,0,0,0,3,0,0,0,0,0,3,0,0,0,4,0,4,0,1], // 3
            [1,0,4,0,0,4,0,0,0,3,0,0,0,0,0,3,0,0,0,4,0,4,0,1], // 4
            [1,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,1], // 5
            [1,0,4,0,0,4,0,0,0,3,0,0,0,0,0,3,0,0,0,4,0,4,0,1], // 6
            [1,0,4,4,0,4,4,0,0,3,3,3,0,3,3,3,0,0,4,4,0,4,0,1], // 7
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 8  frozen corridor
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 9
            [1,5,5,5,0,5,5,0,0,2,2,2,0,2,2,0,0,0,5,5,0,5,5,1], // 10 containment pods
            [1,0,0,5,0,0,5,0,0,2,0,0,0,0,2,0,0,0,5,0,0,0,5,1], // 11
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 12
            [1,0,0,5,0,0,5,0,0,2,0,0,0,0,2,0,0,0,5,0,0,0,5,1], // 13
            [1,5,5,5,0,5,5,0,0,2,2,0,2,2,2,0,0,0,5,5,0,5,5,1], // 14
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 15
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1], // 16
            [1,10,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,10,1], // 17 observation deck + secrets
            [1,0,0,0,0,0,0,0,0,3,3,3,0,3,3,3,0,0,1,1,1,1,1,1], // 18
            [1,0,1,0,0,0,0,0,0,3,0,0,0,0,0,3,0,0,1,0,0,0,0,1], // 19 containment breach
            [1,0,1,0,0,0,0,0,0,3,0,0,0,0,0,3,0,0,1,0,0,0,0,1], // 20
            [1,0,0,0,0,0,0,0,0,3,0,0,0,0,0,3,0,0,0,0,0,0,0,1], // 21
            [1,0,1,0,0,0,0,0,0,3,0,0,0,0,0,3,0,0,1,0,0,0,0,1], // 22
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]  // 23
        ],
        spawn: { x: 4.5, y: 4.5, angle: 0 },
        zones: [
            { name: 'research_wing', bounds: { x1: 2, y1: 2, x2: 6, y2: 7 }, lightTint: { r: 0, g: 0.04, b: 0.12 }, audioProfile: 'control', hudColor: [100, 160, 255] },
            { name: 'cryo_chamber', bounds: { x1: 9, y1: 2, x2: 15, y2: 7 }, lightTint: { r: 0, g: 0.08, b: 0.16 }, audioProfile: 'cooling', hudColor: [80, 200, 255] },
            { name: 'containment_left', bounds: { x1: 1, y1: 10, x2: 6, y2: 14 }, lightTint: { r: 0, g: 0.06, b: 0.10 }, audioProfile: 'cooling', hudColor: [120, 180, 240] },
            { name: 'containment_right', bounds: { x1: 18, y1: 10, x2: 22, y2: 14 }, lightTint: { r: 0, g: 0.06, b: 0.10 }, audioProfile: 'cooling', hudColor: [120, 180, 240] },
            { name: 'breach_zone', bounds: { x1: 9, y1: 18, x2: 15, y2: 22 }, lightTint: { r: 0.04, g: 0.10, b: 0.14 }, audioProfile: 'reactor', hudColor: [140, 220, 255] }
        ],
        defaultZone: { name: 'frozen_corridor', lightTint: { r: 0, g: 0.03, b: 0.06 }, audioProfile: 'corridor', hudColor: null },
        doors: [
            { x: 4, y: 7, key: 'none' },
            { x: 12, y: 7, key: 'none' },
            { x: 20, y: 7, key: 'none' },
            { x: 4, y: 10, key: 'none' },
            { x: 12, y: 18, key: 'red' },
            { x: 11, y: 10, key: 'none' }
        ],
        acidTiles: [[4,12],[5,12],[4,11],[5,11],[19,12],[20,12],[19,11],[20,11]],
        lavaTiles: [],
        enemies: [
            { x: 4, y: 3, type: 'guard' },
            { x: 12, y: 4, type: 'soldier' },
            { x: 20, y: 4, type: 'phantom' },
            { x: 8, y: 8, type: 'imp' },
            { x: 16, y: 8, type: 'guard' },
            { x: 4, y: 12, type: 'spitter' },
            { x: 11, y: 12, type: 'demon' },
            { x: 20, y: 12, type: 'sniper' },
            { x: 8, y: 15, type: 'berserker' },
            { x: 16, y: 15, type: 'exploder' },
            { x: 12, y: 20, type: 'shield_guard' },
            { x: 4, y: 20, type: 'guard' },
            { x: 20, y: 20, type: 'soldier' },
            { x: 14, y: 12, type: 'imp' },
            { x: 6, y: 9, type: 'guard' },
            { x: 19, y: 9, type: 'exploder' },
            { x: 12, y: 21, type: 'boss' }
        ],
        items: [
            { x: 4.5, y: 5.5, type: 'ammo' },
            { x: 12.5, y: 4.5, type: 'health' },
            { x: 20.5, y: 5.5, type: 'ammo' },
            { x: 4.5, y: 12.5, type: 'health' },
            { x: 20.5, y: 12.5, type: 'ammo' },
            { x: 12.5, y: 20.5, type: 'health' }
        ],
        barrels: [
            { x: 8.5, y: 1.5 },
            { x: 15.5, y: 1.5 },
            { x: 2.5, y: 9.5 },
            { x: 21.5, y: 9.5 },
            { x: 8.5, y: 16.5 },
            { x: 15.5, y: 16.5 }
        ],
        crates: [
            { x: 4.5, y: 3.5 },
            { x: 13.5, y: 5.5 },
            { x: 20.5, y: 3.5 },
            { x: 4.5, y: 11.5 },
            { x: 12.5, y: 11.5 },
            { x: 21.5, y: 11.5 },
            { x: 4.5, y: 21.5 },
            { x: 20.5, y: 21.5 }
        ],
        secrets: [
            { wallX: 1, wallY: 17, roomX: 1, roomY: 18 },
            { wallX: 22, wallY: 17, roomX: 22, roomY: 18 }
        ],
        waveSpawnPoints: [
            { x: 12, y: 1 },
            { x: 4, y: 8 },
            { x: 20, y: 8 },
            { x: 4, y: 12 },
            { x: 20, y: 12 },
            { x: 12, y: 12 },
            { x: 4, y: 16 },
            { x: 20, y: 16 },
            { x: 12, y: 20 },
            { x: 8, y: 15 }
        ],
        weaponPickups: [
            { type: 'weapon_shotgun', x: 4.5, y: 5.5 },
            { type: 'weapon_rifle', x: 1.5, y: 12.5 },
            { type: 'weapon_rocket', x: 12.5, y: 12.5 },
            { type: 'weapon_chaingun', x: 20.5, y: 11.5 }
        ],
        traps: [
            // Frozen corridor — plate mid-corridor, dart from south
            { plateX: 12, plateY: 9, dartX: 12, dartY: 8, direction: 'south' },
            // South observation area — plate triggers dart from east
            { plateX: 7, plateY: 16, dartX: 8, dartY: 16, direction: 'west' }
        ]
    }
};

// List of all theme keys for rotation
MapThemes.allThemes = ['reactor', 'military', 'catacombs', 'inferno', 'cryogenics'];

window.MapThemes = MapThemes;
