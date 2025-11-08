// Cesium ionのアクセストークン
Cesium.Ion.defaultAccessToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyOGRiZmY3Yy0wNzRjLTQ2MjktOGQ0Ni0xYmI5MzFmNDUxZDAiLCJpZCI6MzU0MDY0LCJpYXQiOjE3NjE0NTQ3MDh9.p9q4yTuNNbVz7U09nx04n-LQG0sxXh8TDw22H3FSIV0";

(async function () {
    // ===== Viewer =====
    const viewer = new Cesium.Viewer("cesiumContainer", {
        baseLayerPicker: false,    // ← 切り替えを自前で行うのでOFF推奨
        timeline: false,
        animation: false,
        geocoder: false,
        homeButton: false
    });

    // 光源＆時間（任意）
    viewer.scene.globe.enableLighting = true;
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date("2024-06-21T12:00:00Z"));
    viewer.clock.shouldAnimate = false;

    // ===== 地形 =====
    const terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(2767062);
    viewer.terrainProvider = terrainProvider;

    // ===== 画像レイヤーの用意（最初に全部追加）=====
    const layers = viewer.imageryLayers;

    // 衛星
    const satelliteLayer = layers.addImageryProvider(await Cesium.IonImageryProvider.fromAssetId(3830183));
    satelliteLayer.alpha = 1.0;

    // 地理院 地形図
    const gsiLayer = layers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
        url: "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png",
        credit: new Cesium.Credit('<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル</a>'),
        minimumLevel: 2, maximumLevel: 18
    }));
    gsiLayer.alpha = 1.0; gsiLayer.brightness = 0.95;

    // 古地図4枚
    const oldMapLayers = [];

    const kumagawaLayer = layers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
        url: "https://mapwarper.h-gis.jp/maps/tile/845/{z}/{x}/{y}.png",
        credit: new Cesium.Credit('<a href="http://purl.stanford.edu/cb173fj2995" target="_blank">Stanford University Libraries / 熊川</a>'),
        minimumLevel: 2, maximumLevel: 18
    }));
    oldMapLayers.push(kumagawaLayer);

    const chikubushimaLayer = layers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
        url: "https://mapwarper.h-gis.jp/maps/tile/846/{z}/{x}/{y}.png",
        credit: new Cesium.Credit('<a href="http://purl.stanford.edu/zt128hp6132" target="_blank">Stanford University Libraries / 竹生島</a>'),
        minimumLevel: 2, maximumLevel: 18
    }));
    oldMapLayers.push(chikubushimaLayer);

    const hikoneseibuLayer = layers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
        url: "https://mapwarper.h-gis.jp/maps/tile/816/{z}/{x}/{y}.png",
        credit: new Cesium.Credit('<a href="http://purl.stanford.edu/yn560bk7442" target="_blank">Stanford University Libraries / 彦根西部</a>'),
        minimumLevel: 2, maximumLevel: 18
    }));
    oldMapLayers.push(hikoneseibuLayer);

    const kitakomatsuLayer = layers.addImageryProvider(new Cesium.UrlTemplateImageryProvider({
        // ※ 先頭の空白を削除！
        url: "https://mapwarper.h-gis.jp/maps/tile/815/{z}/{x}/{y}.png",
        credit: new Cesium.Credit('<a href="http://purl.stanford.edu/hf547qg6944" target="_blank">Stanford University Libraries / 北小松</a>'),
        minimumLevel: 2, maximumLevel: 18
    }));
    oldMapLayers.push(kitakomatsuLayer);

    // 見栄え調整（共通）
    for (const L of oldMapLayers) {
        L.alpha = 1.0;
        L.brightness = 0.95;
    }

    // ===== 切り替えロジック =====
    function setActiveButton(activeId) {
        for (const id of ["btn-gsi", "btn-sat", "btn-old"]) {
            const el = document.getElementById(id);
            if (el) el.classList.toggle("active", id === activeId);
        }
    }

    function hideAll() {
        gsiLayer.show = false;
        satelliteLayer.show = false;
        for (const L of oldMapLayers) L.show = false;
    }

    function showGSI() {
        hideAll();
        gsiLayer.show = true;
        // ベースらしく最背面へ
        layers.lowerToBottom(gsiLayer);
        setActiveButton("btn-gsi");
    }

    function showSatellite() {
        hideAll();
        satelliteLayer.show = true;
        layers.lowerToBottom(satelliteLayer);
        setActiveButton("btn-sat");
    }

    function showOldMaps() {
        hideAll();
        for (const L of oldMapLayers) {
            L.show = true;
            // 古地図群は上に重ねておく（どれが上でもOK）
            layers.raiseToTop(L);
        }
        setActiveButton("btn-old");
    }

    // 初期表示：地理院
    showGSI();

    // ===== ボタン紐づけ =====
    document.getElementById("btn-gsi").addEventListener("click", showGSI);
    document.getElementById("btn-sat").addEventListener("click", showSatellite);
    document.getElementById("btn-old").addEventListener("click", showOldMaps);

    // ===== あなたのGeoJSON・ルート等はここから下にそのまま =====
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
