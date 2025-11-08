// Cesium ionのアクセストークン
Cesium.Ion.defaultAccessToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyOGRiZmY3Yy0wNzRjLTQ2MjktOGQ0Ni0xYmI5MzFmNDUxZDAiLCJpZCI6MzU0MDY0LCJpYXQiOjE3NjE0NTQ3MDh9.p9q4yTuNNbVz7U09nx04n-LQG0sxXh8TDw22H3FSIV0";

// 非同期処理を関数でラップ
(async function () {
    // Cesium Viewerの初期化
    const viewer = new Cesium.Viewer("cesiumContainer", {
        baseLayerPicker: true,
        timeline: false,
        animation: false,
        geocoder: false,
        homeButton: false
    });
    // ★ ここにまとめて置けばすべて正しく動く
    viewer.scene.globe.enableLighting = true;
    // 2024年6月21日 正午（夏至の正午）
    viewer.clock.currentTime = Cesium.JulianDate.fromDate(
        new Date('2024-06-21T12:00:00Z')
    );
    viewer.clock.shouldAnimate = false; // 時間停止
    // GeoJSONを直接ここに貼る
    const routeGeojson = {
        "type": "FeatureCollection",
        "name": "route",
        "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "name": "A",
                    "symbol": null,
                    "style": "Line",
                    "number": null,
                    "comment": null,
                    "description": null,
                    "source": null,
                    "url": null,
                    "url name": null
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": [
                        [135.979309744654415, 35.363503452799705], [135.992428535392122, 35.357807738323956], [135.987898305497112, 35.350264146729216], [136.001677754761204, 35.346953981069525], [136.010171935814412, 35.343643679763964], [136.018666116867649, 35.338023555321548], [136.02064809244672, 35.342873822810766], [136.027443437289293, 35.350802998067692], [136.029897311815802, 35.359501100813517], [136.033672503394968, 35.368583075360242], [136.032728705500176, 35.378510505577488], [136.034050022552861, 35.386051457960576], [136.034899440658222, 35.38643618152998], [136.033766883184455, 35.389744728480238], [136.035276959816116, 35.397669300665093], [136.038957771605851, 35.403669914822459], [136.046225015395805, 35.410131615184817]
                    ]
                }
            },
            { "type": "Feature", "properties": { "name": "B", "style": "arrow", "symbol": null, "number": null, "comment": null, "description": null, "source": null, "url": null, "url name": null }, "geometry": { "type": "LineString", "coordinates": [[135.971075108022262, 35.361348364845711, 500], [136.014867330341048, 35.338716468502554, 500], [136.043936305500949, 35.406131576041915, 500]] } }
        ]
    }
        ;



    // 地形: Japan Regional Terrain（先に読み込む）
    const terrainProvider = await Cesium.CesiumTerrainProvider.fromIonAssetId(2767062);
    viewer.terrainProvider = terrainProvider;

    // イメージャリー: Google Maps 2D Satellite with Labels（先に読み込む）
    const imageryProvider = await Cesium.IonImageryProvider.fromAssetId(3830183);
    viewer.imageryLayers.addImageryProvider(imageryProvider);

    // 地理院地形図レイヤー（先に読み込む）
    const chikeizuProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
        credit: new Cesium.Credit('<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank">地理院タイル</a>'),
        minimumLevel: 2,
        maximumLevel: 18
    });
    const chikeizuLayer = viewer.imageryLayers.addImageryProvider(chikeizuProvider);
    chikeizuLayer.alpha = 1.0; // 0.0 is transparent.  1.0 is opaque.
    chikeizuLayer.brightness = 0.95; // > 1.0 increases brightness.  < 1.0 decreases.

    // 『熊川』五万分一地形圖（先に読み込む）
    const kumagawaProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://mapwarper.h-gis.jp/maps/tile/845/{z}/{x}/{y}.png',
        credit: new Cesium.Credit('<a href="http://purl.stanford.edu/cb173fj2995" target="_blank">Image from the Map Collections courtesy Stanford University Libraries, licensed under a Creative Commons Attribution-Noncommercial 3.0 Unported License. © Stanford University. 【図幅名】 熊川 【測量時期】 明治26年測図/大正9年修正 【発行時期】 【記号】 宮津4号（共5面） 【測量機関】 参謀本部 【備考】 秘</a>'),
        minimumLevel: 2,
        maximumLevel: 18
    });
    const kumagawaLayer = viewer.imageryLayers.addImageryProvider(kumagawaProvider);
    kumagawaLayer.alpha = 1.0; // 0.0 is transparent.  1.0 is opaque.
    kumagawaLayer.brightness = 0.95; // > 1.0 increases brightness.  < 1.0 decreases.

    // 『竹生島』五万分一地形圖 （先に読み込む）
    const chikubushimaProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://mapwarper.h-gis.jp/maps/tile/846/{z}/{x}/{y}.png',
        credit: new Cesium.Credit('<a href="http://purl.stanford.edu/zt128hp6132" target="_blank">Image from the Map Collections courtesy Stanford University Libraries, licensed under a Creative Commons Attribution-Noncommercial 3.0 Unported License. © Stanford University. 【図幅名】 竹生島 【測量時期】 明治26年測図/大正9年修正/昭和7年鉄道補入/昭和26年応急修正 【発行時期】 昭和29年9月発行 【記号】 岐阜16号（共16面） 【測量機関】 国土地理院 【備考】 応急修正版</a>'),
        minimumLevel: 2,
        maximumLevel: 18
    });
    const chikubushimaLayer = viewer.imageryLayers.addImageryProvider(chikubushimaProvider);
    chikubushimaLayer.alpha = 1.0; // 0.0 is transparent.  1.0 is opaque.
    chikubushimaLayer.brightness = 0.95; // > 1.0 increases brightness.  < 1.0 decreases.

    // 『彦根西部』五万分一地形圖 （先に読み込む）
    const hikoneseibuProvider = new Cesium.UrlTemplateImageryProvider({
        url: 'https://mapwarper.h-gis.jp/maps/tile/816/{z}/{x}/{y}.png',
        credit: new Cesium.Credit('<a href="http://purl.stanford.edu/yn560bk7442" target="_blank">Image from the Map Collections courtesy Stanford University Libraries, licensed under a Creative Commons Attribution-Noncommercial 3.0 Unported License. © Stanford University. 【図幅名】 彦根西部 【測量時期】 明治26年測図/大正9年修正/昭和7年鉄道補入 【発行時期】 昭和8年6月発行 【記号】 名古屋13号（共16面） 【測量機関】 大日本帝国陸地測量部 </a>'),
        minimumLevel: 2,
        maximumLevel: 18
    });
    const hikoneseibuLayer = viewer.imageryLayers.addImageryProvider(hikoneseibuProvider);
    hikoneseibuLayer.alpha = 1.0; // 0.0 is transparent.  1.0 is opaque.
    hikoneseibuLayer.brightness = 0.95; // > 1.0 increases brightness.  < 1.0 decreases.

    // 『北小松』五万分一地形圖 （先に読み込む）
    const kitakomatsuProvider = new Cesium.UrlTemplateImageryProvider({
        url: ' https://mapwarper.h-gis.jp/maps/tile/815/{z}/{x}/{y}.png',
        credit: new Cesium.Credit('<a href="http://purl.stanford.edu/hf547qg6944" target="_blank">Image from the Map Collections courtesy Stanford University Libraries, licensed under a Creative Commons Attribution-Noncommercial 3.0 Unported License. © Stanford University. 【図幅名】 北小松 【測量時期】 明治26年測図/大正9年修正/昭和7年鉄道補入 【発行時期】 【記号】 京都及大阪1号（共16面） 【測量機関】 参謀本部 【備考】 秘</a>'),
        minimumLevel: 2,
        maximumLevel: 18
    });
    const kitakomatsuLayer = viewer.imageryLayers.addImageryProvider(kitakomatsuProvider);
    kitakomatsuLayer.alpha = 1.0; // 0.0 is transparent.  1.0 is opaque.
    kitakomatsuLayer.brightness = 0.95; // > 1.0 increases brightness.  < 1.0 decreases.

    // GeoJSONルートの読み込み

    console.log('GeoJSON読み込み開始:');

    try {
        const dataSource = await Cesium.GeoJsonDataSource.load(routeGeojson);
        console.log('GeoJSON読み込み成功');
        viewer.dataSources.add(dataSource);

        const entities = dataSource.entities.values;
        console.log('エンティティ数:', entities.length);

        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            const p = entity.properties;
            const style = p?.style?.getValue?.();           // "Line" or "arrow"
            const name = entity.name ?? p?.name?.getValue?.();

            // ----------- Polyline の設定 -----------
            if (entity.polyline) {
                entity.polyline.width = 5;

                // ★ B = 矢印つき黄色線（clampToGroundを無効化）
                if (style === "arrow" || name === "B") {

                    // 半透明の黄色（RGBA）
                    const yellowTrans = Cesium.Color.YELLOW.withAlpha(0.5);

                    // 太く
                    entity.polyline.width = 20;

                    // 半透明矢印
                    entity.polyline.material =
                        new Cesium.PolylineArrowMaterialProperty(yellowTrans);

                    entity.polyline.clampToGround = false;    // 高度データを使う
                    entity.polyline.heightReference = Cesium.HeightReference.NONE;

                } else {
                    // ★ A = 点線（赤）
                    entity.polyline.material = new Cesium.PolylineDashMaterialProperty({
                        color: Cesium.Color.RED,
                        gapColor: Cesium.Color.TRANSPARENT,   // 点線の「隙間」
                        dashLength: 17,                       // 破線のパターンの長さ
                    });
                    entity.polyline.width = 4;
                    entity.polyline.clampToGround = true;
                }
            }

            // ポイントの設定
            if (entity.position) {
                entity.point = new Cesium.PointGraphics({
                    pixelSize: 10,
                    color: Cesium.Color.YELLOW,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 2
                });

                // スタート地点（緑）
                if (i === 0) {
                    entity.point.pixelSize = 15;
                    entity.point.color = Cesium.Color.GREEN;
                }

                // ゴール地点（青）
                if (i === entities.length - 1) {
                    entity.point.pixelSize = 15;
                    entity.point.color = Cesium.Color.BLUE;
                }
            }
        }

        // スタートのポイント
        viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees( 135.979263,35.363388, 184),
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
            position: Cesium.Cartesian3.fromDegrees( 136.045187,35.409939, 134),
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

        // ルートが読み込まれたらカメラをルートに合わせる
        viewer.flyTo(dataSource);

    } catch (error) {
        console.error('GeoJSON読み込みエラー:', error);
    }
})();