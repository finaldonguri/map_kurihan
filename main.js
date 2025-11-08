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
                        [135.976610482675341, 35.36482341576319], [135.976799968252664, 35.363827599101512], [135.978905363556464, 35.363106482816328], [135.979136957039884, 35.362144984416524], [135.981305514202774, 35.361801589355807], [135.982989830445803, 35.360599695141488], [135.986084761542372, 35.359397783035647], [135.989621825652762, 35.358813990700185], [135.991242980036645, 35.358161511918581], [135.988905991249453, 35.352924320188713], [135.989369178216293, 35.352769774945934], [135.988232264752241, 35.350108116027741], [135.993179943716143, 35.347669616032995], [135.996822277591662, 35.346433165374883], [135.997622327807107, 35.346673587818373], [135.998043406867851, 35.346656414810418], [135.998548701740759, 35.347308986546011], [136.002380521193629, 35.346982701337168], [136.008654599198934, 35.345626027652742], [136.009665188944751, 35.344801708464082], [136.011202127516469, 35.344750188235508], [136.01259168841699, 35.345763413366434], [136.015876105090939, 35.345368428809813], [136.020697460336578, 35.344252157665487], [136.020129003604552, 35.343118697337381], [136.020739568242675, 35.345282562346299], [136.021539618458121, 35.345969491498906], [136.022171237049236, 35.347412023706568], [136.023581851902776, 35.347583752015453], [136.024213470493891, 35.348631286793889], [136.025729355112617, 35.349197980273942], [136.026508351375014, 35.349404049644598], [136.026908376482737, 35.351670778024122], [136.027476833214735, 35.352271793818595], [136.02949801270637, 35.358985694766403], [136.030003307579307, 35.359191739163919], [136.03023490106267, 35.360273463624686], [136.030024361532355, 35.36035931415163], [136.032508727990802, 35.367261397807113], [136.033414047971462, 35.369802314812873], [136.032382404272596, 35.371639279315829], [136.032340296366499, 35.376943923400823], [136.033266670300208, 35.380205505538967], [136.032803483333367, 35.382231053341421], [136.033519317736648, 35.386487971101189], [136.035119418167511, 35.386590958263845], [136.033793019126108, 35.389096938693349], [136.033793019126108, 35.392272213020235], [136.034256206092977, 35.394983969953671], [136.03514047212056, 35.397438202993641], [136.03629843953766, 35.39989236133399], [136.036656356739286, 35.400561664280318], [136.036045792101191, 35.401711479446639], [136.037372191142595, 35.401883092244105], [136.037961701827641, 35.40262102311042], [136.038382780888384, 35.403101532601397], [136.039161777150781, 35.40454304388949], [136.03989866550711, 35.405658481361883], [136.043288351946245, 35.408335468319009], [136.044319995645111, 35.409450853310375], [136.045793772357712, 35.408060909645997]
                    ]
                }
            },
            {
                "type": "Feature",
                "properties": { "name": "B", "style": "arrow" },
                "geometry": {
                    "type": "LineString", "coordinates": [
                        [135.974084008310768, 35.363175160835276, 500], [135.987726969879276, 35.35726863767357, 500], [135.986716380133458, 35.349438394488594, 500], [136.009117786165717, 35.343256087314963, 500], [136.020571136618315, 35.342843916681225, 500], [136.031687623822336, 35.368257172110532, 500], [136.033708803313971, 35.39736955413391, 500], [136.041961952904813, 35.411098162909411, 350], [136.045835880263752, 35.408215349014647, 250]
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
                    entity.polyline.width = 25;
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
            position: Cesium.Cartesian3.fromDegrees(135.9764736, 35.3648148, 184),
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
            position: Cesium.Cartesian3.fromDegrees(136.045836, 35.408181, 134),
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
