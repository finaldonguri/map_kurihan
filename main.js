// Cesium ionのアクセストークン
Cesium.Ion.defaultAccessToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyOGRiZmY3Yy0wNzRjLTQ2MjktOGQ0Ni0xYmI5MzFmNDUxZDAiLCJpZCI6MzU0MDY0LCJpYXQiOjE3NjE0NTQ3MDh9.p9q4yTuNNbVz7U09nx04n-LQG0sxXh8TDw22H3FSIV0";

// 非同期処理を関数でラップ
(async function () {
    // Cesium Viewerの初期化（自前ボタンを使うので baseLayerPicker: false 推奨）
    const viewer = new Cesium.Viewer("cesiumContainer", {
        baseLayerPicker: false,
        timeline: false,
        animation: false,
        geocoder: false,
        homeButton: false,
    });

    // 昼光の見た目固定（任意）
    viewer.scene.globe.enableLighting = true;
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(new Date("2024-06-21T12:00:00Z"));
    viewer.clock.shouldAnimate = false;

    // ===== 画像レイヤーの準備 =====

    // 地形（先に設定）
    const terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(2767062);
    viewer.terrainProvider = terrainProvider;

    // 衛星（Google 2D Satellite with Labels）
    const ionSatellite = await Cesium.IonImageryProvider.fromAssetId(3830183);
    const satelliteLayer = viewer.imageryLayers.addImageryProvider(ionSatellite);

    // 地理院 標準地図
    const chikeizuLayer = viewer.imageryLayers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({
            url: "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png",
            credit: new Cesium.Credit(
                '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル</a>'
            ),
            minimumLevel: 2,
            maximumLevel: 18,
        })
    );

    // 古地図4枚
    const kumagawaLayer = viewer.imageryLayers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({
            url: "https://mapwarper.h-gis.jp/maps/tile/845/{z}/{x}/{y}.png",
            credit: new Cesium.Credit(
                '<a href="http://purl.stanford.edu/cb173fj2995" target="_blank">Stanford SUL（熊川）</a>'
            ),
            minimumLevel: 2,
            maximumLevel: 18,
        })
    );

    const chikubushimaLayer = viewer.imageryLayers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({
            url: "https://mapwarper.h-gis.jp/maps/tile/846/{z}/{x}/{y}.png",
            credit: new Cesium.Credit(
                '<a href="http://purl.stanford.edu/zt128hp6132" target="_blank">Stanford SUL（竹生島）</a>'
            ),
            minimumLevel: 2,
            maximumLevel: 18,
        })
    );

    const hikoneseibuLayer = viewer.imageryLayers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({
            url: "https://mapwarper.h-gis.jp/maps/tile/816/{z}/{x}/{y}.png",
            credit: new Cesium.Credit(
                '<a href="http://purl.stanford.edu/yn560bk7442" target="_blank">Stanford SUL（彦根西部）</a>'
            ),
            minimumLevel: 2,
            maximumLevel: 18,
        })
    );

    const kitakomatsuLayer = viewer.imageryLayers.addImageryProvider(
        new Cesium.UrlTemplateImageryProvider({
            // ※ 先頭の空白を削除
            url: "https://mapwarper.h-gis.jp/maps/tile/815/{z}/{x}/{y}.png",
            credit: new Cesium.Credit(
                '<a href="http://purl.stanford.edu/hf547qg6944" target="_blank">Stanford SUL（北小松）</a>'
            ),
            minimumLevel: 2,
            maximumLevel: 18,
        })
    );

    // レイヤー辞書（名前→ImageryLayer）
    const layers = {
        chikeizu: chikeizuLayer,
        satellite: satelliteLayer,
        kumagawa: kumagawaLayer,
        chikubushima: chikubushimaLayer,
        hikoneseibu: hikoneseibuLayer,
        kitakomatsu: kitakomatsuLayer,
    };

    // まず全てを非表示にして、地理院だけ表示
    Object.values(layers).forEach((l) => (l.show = false));
    layers.chikeizu.show = true;

    // 念のためすべて最背面に下げた上で、表示対象を最背面に（ベースレイヤー挙動）
    Object.values(layers).forEach((l) => viewer.imageryLayers.lowerToBottom(l));

    // ボタンで切り替え
    const switcher = document.getElementById("layerSwitcher");

    function setBaseLayer(name) {
        Object.entries(layers).forEach(([key, layer]) => {
            layer.show = key === name;
            // ベースは完全不透明＆標準明るさに
            if (key === name) {
                layer.alpha = 1.0;
                layer.brightness = 1.0;
                viewer.imageryLayers.lowerToBottom(layer); // 念押しで最背面
            }
        });

        // ボタンの見た目更新
        for (const btn of switcher.querySelectorAll("button")) {
            btn.classList.toggle("active", btn.dataset.layer === name);
        }
    }

    switcher.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-layer]");
        if (!btn) return;
        setBaseLayer(btn.dataset.layer);
    });

    // ====== 以下はあなたのGeoJSONやルート描画（そのまま） ======
    const routeGeojson = {
        "type": "FeatureCollection",
        "name": "route",
        "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        "features": [
            {
                "type": "Feature",
                "properties": { "name": "A", "style": "Line" },
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [135.9793097446544, 35.363503452799705],
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
                    "type": "LineString",
                    "coordinates": [
                        [135.97107510802226, 35.36134836484571, 500],
                        [136.01486733034105, 35.338716468502554, 500],
                        [136.04393630550095, 35.406131576041915, 500]
                    ]
                }
            }
        ]
    };

    try {
        const dataSource = await Cesium.GeoJsonDataSource.load(routeGeojson);
        viewer.dataSources.add(dataSource);

        const entities = dataSource.entities.values;
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
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

        // Start/Finish（そのまま）
        viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(135.979263, 35.363388, 184),
            point: { pixelSize: 8, color: Cesium.Color.RED, outlineColor: Cesium.Color.WHITE, outlineWidth: 2 },
            label: {
                text: "Start", font: "14pt sans-serif",
                style: Cesium.LabelStyle.FILL_AND_OUTLINE, fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK, outlineWidth: 3,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -9)
            }
        });

        viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(136.045187, 35.409939, 134),
            point: { pixelSize: 8, color: Cesium.Color.RED, outlineColor: Cesium.Color.WHITE, outlineWidth: 2 },
            label: {
                text: "Finish", font: "14pt sans-serif",
                style: Cesium.LabelStyle.FILL_AND_OUTLINE, fillColor: Cesium.Color.WHITE,
                outlineColor: Cesium.Color.BLACK, outlineWidth: 3,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM, pixelOffset: new Cesium.Cartesian2(0, -9)
            }
        });

        viewer.flyTo(dataSource);
    } catch (e) {
        console.error("GeoJSON読み込みエラー:", e);
    }
})();
