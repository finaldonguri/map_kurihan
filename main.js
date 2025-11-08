// Cesium ionのアクセストークン
Cesium.Ion.defaultAccessToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyOGRiZmY3Yy0wNzRjLTQ2MjktOGQ0Ni0xYmI5MzFmNDUxZDAiLCJpZCI6MzU0MDY0LCJpYXQiOjE3NjE0NTQ3MDh9.p9q4yTuNNbVz7U09nx04n-LQG0sxXh8TDw22H3FSIV0";

(async function () {
    // ===== Viewer =====
    const viewer = new Cesium.Viewer("cesiumContainer", {
        baseLayerPicker: false,
        timeline: false,
        animation: false,
        geocoder: false,
        homeButton: false
    });
    // ★★ ここを追加：既定のベースレイヤーを完全に除去 ★★
    while (viewer.imageryLayers.length > 0) {
        viewer.imageryLayers.remove(viewer.imageryLayers.get(0), false);
    }
    // ↑ これで「最初から載ってるレイヤー」はゼロになります

    // 光源＆時間（任意）
    viewer.scene.globe.enableLighting = true;
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date("2024-06-21T12:00:00Z"));
    viewer.clock.shouldAnimate = false;

    // ===== 地形 =====
    const terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(2767062);
    viewer.terrainProvider = terrainProvider;

    // ===== 画像レイヤーの用意 =====
    const layers = viewer.imageryLayers;

    // 衛星（Ion）
    const satelliteProvider = await Cesium.IonImageryProvider.fromAssetId(3830183);

    // 地理院 標準地図
    const gsiProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
        credit: new Cesium.Credit('<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル</a>'),
        minimumLevel: 2,
        maximumLevel: 18
    });

    // 古地図4枚（※ kitakomatsu のURL先頭の空白は消しておきます）
    const kitakomatsuProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://mapwarper.h-gis.jp/maps/tile/815/{z}/{x}/{y}.png',
        credit: new Cesium.Credit('<a href="http://purl.stanford.edu/hf547qg6944" target="_blank">…北小松…</a>'),
        minimumLevel: 2,
        maximumLevel: 18
    });
    const kumagawaProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://mapwarper.h-gis.jp/maps/tile/845/{z}/{x}/{y}.png',
        credit: new Cesium.Credit('<a href="http://purl.stanford.edu/cb173fj2995" target="_blank">…熊川…</a>'),
        minimumLevel: 2,
        maximumLevel: 18
    });
    const chikubushimaProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://mapwarper.h-gis.jp/maps/tile/846/{z}/{x}/{y}.png',
        credit: new Cesium.Credit('<a href="http://purl.stanford.edu/zt128hp6132" target="_blank">…竹生島…</a>'),
        minimumLevel: 2,
        maximumLevel: 18
    });
    const hikoneseibuProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://mapwarper.h-gis.jp/maps/tile/816/{z}/{x}/{y}.png',
        credit: new Cesium.Credit('<a href="http://purl.stanford.edu/yn560bk7442" target="_blank">…彦根西部…</a>'),
        minimumLevel: 2,
        maximumLevel: 18
    });

    // レイヤーを一度だけ追加して参照を保持
    const layerSatellite = viewer.imageryLayers.addImageryProvider(satelliteProvider); // 衛星
    const layerGSI = viewer.imageryLayers.addImageryProvider(gsiProvider);            // 地理院

    // 古地図は上に重ねる前提で追加（順序はお好みで）
    const layerOlds = [
        viewer.imageryLayers.addImageryProvider(kumagawaProvider),
        viewer.imageryLayers.addImageryProvider(chikubushimaProvider),
        viewer.imageryLayers.addImageryProvider(hikoneseibuProvider),
        viewer.imageryLayers.addImageryProvider(kitakomatsuProvider),
    ];

    // 初期状態は「衛星」だけ表示に
    function allOff() {
        layerSatellite.show = false;
        layerGSI.show = false;
        layerOlds.forEach(l => (l.show = false));
    }
    allOff();
    layerSatellite.show = true;

    // 見た目の調整（任意）
    [layerSatellite, layerGSI, ...layerOlds].forEach(l => {
        l.alpha = 1.0;
        l.brightness = 0.95;
    });

    // 切替ヘルパ（排他的に）
    function showSatellite() {
        allOff();
        layerSatellite.show = true;
        // 衛星を最背面にしたいなら：
        viewer.imageryLayers.lowerToBottom(layerSatellite);
    }

    function showGSI() {
        allOff();
        layerGSI.show = true;
        viewer.imageryLayers.lowerToBottom(layerGSI);
    }

    function showOldMaps() {
        allOff();
        // ベース無しで古地図のみ表示（古地図の重なりがそのまま出ます）
        layerOlds.forEach(l => (l.show = true));
        // 必要なら一枚を最上面に
        viewer.imageryLayers.raiseToTop(layerOlds[layerOlds.length - 1]);
    }

    // 既存のボタンにイベントを付与（idはHTML側に合わせて）
    document.getElementById('btn-satellite').onclick = showSatellite;
    document.getElementById('btn-gsi').onclick = showGSI;
    document.getElementById('btn-old').onclick = showOldMaps;

    // --- ここまでイメージ切替 ---
    // ===== GeoJSON・ルート等はここから下にそのまま =====
    const routeGeojson = {
        "type": "FeatureCollection",
        "name": "route",
        "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        "features": [
            {
                "type": "Feature",
                "properties": { "name": "A", "style": "Line" },
                "geometry": {
                    "type": "LineString", "coordinates": [
                        [135.97930974465442, 35.363503452799705],
                        [135.99242853539212, 35.357807738323956],
                        [135.9878983054971, 35.350264146729216],
                        [136.0016777547612, 35.346953981069525],
                        [136.0101719358144, 35.343643679763964],
                        [136.01866611686765, 35.33802355532155],
                        [136.02064809244672, 35.342873822810766],
                        [136.0274434372893, 35.35080299806769],
                        [136.0298973118158, 35.35950110081352],
                        [136.03367250339497, 35.36858307536024],
                        [136.03272870550018, 35.37851050557749],
                        [136.03405002255286, 35.386051457960576],
                        [136.03489944065822, 35.38643618152998],
                        [136.03376688318446, 35.38974472848024],
                        [136.03527695981612, 35.39766930066509],
                        [136.03895777160585, 35.40366991482246],
                        [136.0462250153958, 35.41013161518482]
                    ]
                }
            },
            {
                "type": "Feature",
                "properties": { "name": "B", "style": "arrow" },
                "geometry": {
                    "type": "LineString", "coordinates": [
                        [135.97107510802226, 35.36134836484571, 500],
                        [136.01486733034105, 35.338716468502554, 500],
                        [136.04393630550095, 35.406131576041915, 500]
                    ]
                }
            }
        ]
    };

    try {
        const ds = await Cesium.GeoJsonDataSource.load(routeGeojson);
        viewer.dataSources.add(ds);
        const entities = ds.entities.values;

        for (const entity of entities) {
            const p = entity.properties;
            const style = p?.style?.getValue?.();
            const name = entity.name ?? p?.name?.getValue?.();

            if (entity.polyline) {
                entity.polyline.width = 5;

                if (style === "arrow" || name === "B") {
                    const yellowTrans = Cesium.Color.YELLOW.withAlpha(0.5);
                    entity.polyline.width = 20;
                    entity.polyline.material = new Cesium.PolylineArrowMaterialProperty(yellowTrans);
                    entity.polyline.clampToGround = false;
                    entity.polyline.heightReference = Cesium.HeightReference.NONE;
                } else {
                    entity.polyline.material = new Cesium.PolylineDashMaterialProperty({
                        color: Cesium.Color.RED,
                        gapColor: Cesium.Color.TRANSPARENT,
                        dashLength: 17,
                    });
                    entity.polyline.width = 4;
                    entity.polyline.clampToGround = true;
                }
            }
        }


        // スタートのポイント
        viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(135.979263, 35.363388, 184),
            point: {
                pixelSize: 8,
                color: Cesium.Color.RED,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2
            },
            label: {
                text: 'Start',
                font: '14pt sans-serif',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 3,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -9)
            }
        });

        // ゴールのポイント
        viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(136.045187, 35.409939, 134),
            point: {
                pixelSize: 8,
                color: Cesium.Color.RED,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2
            },
            label: {
                text: 'Finish',
                font: '14pt sans-serif',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK,
                outlineWidth: 3,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -9)
            }
        });

        viewer.flyTo(ds);
    } catch (e) {
        console.error("GeoJSON読み込みエラー:", e);
    }
})();
