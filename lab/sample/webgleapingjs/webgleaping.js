
"use strict";

(function() {

  // 背景素材
  var backgroundImages = [
      { imgUrl : "texture/grass.jpg" },
      { imgUrl : "texture/wall.jpg" },
      { imgUrl : "texture/wood.jpg" },
      { imgUrl : "texture/fence.jpg" },
      { imgUrl : "texture/outside.jpg" }
  ];

  var cvwidth     = 0;
  var cvheight    = 0;
  var vertints     = new Array(50000); // バーテックスバッファ
  var texint;
  var texs         = new Array(1024); // テクスチャバッファ
  var xPos         = 40.00;
  var yPos         = 20.00;
  var zPos         = 10.00;
  var targetX      = 0;
  var targetY      = 0;
  var targetZ      = 0;
  var beginX       = 25.00;
  var beginY       = 20.00;
  var beginZ       = 10.00;
  var slideCount   = 0; // 最初のスライドの位置

  var MAX_X        = 50;
  var MAX_Z        = 50;

  var mvMatrix;
  var mvMatrixStack;
  var pMatrix;
  var uViewMatrix;

  var slides = [];


  var head = document.querySelector("head");
  var body = null; // あとでセットする
  var sections = null; // あとでセットする
  var canvas = document.createElement("canvas");

  //////////////////////////
  // デフォルトのCSSを登録
  (function(){
    var defaultStyle = document.createElement("style");
    defaultStyle.textContent = 
      "html,body {"+
        "text-align :center;"+
        "background-color : #000000;"+
        "color : #FFFFFF;"+
        "overflow : hidden;"+
        "margin : 0 0;"+
      "}"+
      "h1 {"+
        "display : none;"+
      "}"+
      "section {"+
        "display : none;"+
      "}"+
      "";
    head.appendChild(defaultStyle);
  })();

  //////////////////////////
  // シェーダの定義
  var vshaderText = 
    "attribute vec4 vPosition;\n"+
    "attribute vec4 vTexCoord;\n"+
    "varying   vec2 texCoord;\n"+
    "uniform   mat4 uViewMatrix;\n"+
    "void main()\n"+
    "{\n"+
      "gl_Position = uViewMatrix * vPosition;\n"+
      "texCoord.xy = vTexCoord.xy;\n"+
    "}\n"+
    "";
  var fshaderText = 
    "#ifdef GL_ES\n"+
    "precision highp float;\n"+
    "#endif\n"+
      "uniform sampler2D sampler2d;\n"+
      "varying vec2 texCoord;\n"+
      "void main()\n"+
      "{\n"+
        "gl_FragColor = texture2D(sampler2d, texCoord);\n"+
      "}\n"+
    "";


  var controlFrame = function(fn) { setTimeout(fn,1000/60); };


  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // 初期化処理
  var init = function(canvas) {
    
    ///////////////////////////////////////////////////////////////////////////////
    // WebGLを初期化するんだぜ！
    // ・WebGLを動かすためのメカニズムを取得する。
    // 　OpenGL対応のビデオカードへアクセスするためのインタフェースを定義していて、
    // 　2013年2月の段階では、どのブラウザもexperimental版のものしか無い。
    // 　今後はそれが標準となる予定らしい。今は暫定で、これを利用する。
    var gl = canvas.getContext("experimental-webgl"); // WebGLへアクセスするためのインタフェースを取得
    if (!gl) {
      alert("WebGLが動かないブラウザです！GoogleChromeで試して下さい！"); // そんなブラウザは消えてしま（ｒｙ
      return null;
    }
    var fshader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fshader, fshaderText); // スクリプトの読み込み
    gl.compileShader(fshader); // コンパイル！
    var vshader = gl.createShader(gl.VERTEX_SHADER);;
    gl.shaderSource(vshader, vshaderText); // スクリプトの読み込み
    gl.compileShader(vshader); // コンパイル！
    
    // 各シェーダを有効にするのです！
    gl.program = gl.createProgram(); // プログラムをシステムメモリに置いている？？のかなぁ？？なにこれ！？
    gl.attachShader(gl.program, vshader); // ビデオカードのメモリ上に置いている？？のだと思う。
    gl.attachShader(gl.program, fshader); // ビデオカードのメモリ上に置いている？？のだと思う。
    gl.bindAttribLocation(gl.program, 0, "vPosition"); // アクセスするための方法（アドレス的なもの）を設定
    gl.bindAttribLocation(gl.program, 1, "vTexCoord"); // アクセスするための方法（アドレス的なもの）を設定
    gl.enableVertexAttribArray(0);  // vPosition(バーテックスの方）を有効にする
    gl.enableVertexAttribArray(1);  // vTexCoord(フラグメントの方）を有効にする
    gl.linkProgram(gl.program); // ビデオカード側へリンク接続
    gl.useProgram(gl.program); // ビデオカードは今から、このプログラムを使うように指示！
    
    
    ///////////////////////////////////////////////////////////////////////////////
    // ここからは、描画（オブジェ・画像を重ねる処理）を行うための設定を指定しているんだぜ
    // ・オブジェや画像が重なったり、オブジェの位置に遠近があった場合に、
    // 　どういう振る舞いをするかをビデオカードに指示する。
    // 　絵を描く人ならわかると思うけど、例えば画像と画像を重ねる時、
    // 　単純に上書きするだけじゃなくて、乗算処理とか、そういうやりかたもありますよね？
    // 　背景も、何色にすべきかとか、そういうのもここで指示しておく。
    // 　ゲーム実行時に頻繁に変更されるので、ここでデフォルト値を指定していると考えて良い。
    
    // 深度バッファ系(オブジェ同士を重ねるための処理)の初期化
    gl.clearDepth(1000); // 深度バッファ(オブジェの位置を記録する場所)は1000で、空にするよう指示！
    gl.enable(gl.DEPTH_TEST); // 深度の計算（オフジェの前後関係計算）はそっちでやれとビデオカードに指示！

    // ブレンディング系(画像同時を重ねるための処理)の初期化
    gl.enable(gl.TEXTURE_2D); // 2D画像を扱う処理は有効にするようビデオカードに指示！
    gl.clearColor(0, 0, 0, 1); // 背景は全部黒(0,0,0)で塗りつぶしていおいてとビデオカードに指示！
    gl.enable(gl.BLEND);                                // 画像を重ねた時、透過色を反映した状態で、
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); // 前の描画された状態の上に、計算し重ねるよう指示！
    

    ///////////////////////////////////////////////////////////////////////////////
    // 先ほど初期化したシェーダに、具体的なデータを詰めるんだぜ！！
    // ・ビデオカードの装置自体の初期化が終わったので、
    // 　今度はその装置に流しこむデータを指定する。
    
    // スライドの画像と場所をセット
    loadTexture( gl, 1000, backgroundImages[1] );
    for( var i=0 ; i<slides.length ; i++ ) {
        slides[i].rightTopX    = (+1.0); slides[i].rightTopY    = (+1.0); slides[i].rightTopZ    = (-0.70);
        slides[i].leftTopX     = (-0.0); slides[i].leftTopY     = (+1.0); slides[i].leftTopZ     = (-0.70);
        slides[i].rightBottomX = (+1.0); slides[i].rightBottomY = (-0.0); slides[i].rightBottomZ = (-0.70);
        slides[i].leftBottomX  = (-0.0); slides[i].leftBottomY  = (-0.0); slides[i].leftBottomZ  = (-0.70);
        loadTexture( gl, i, slides[i] );
        loadPoli( gl, i, slides[i] );

        slides[i].rightTopX    = (+0.0); slides[i].rightTopY    = (+1.0); slides[i].rightTopZ    = (-0.70);
        slides[i].leftTopX     = (-0.0); slides[i].leftTopY     = (+1.0); slides[i].leftTopZ     = (-1.00);
        slides[i].rightBottomX = (+0.0); slides[i].rightBottomY = (-0.0); slides[i].rightBottomZ = (-0.70);
        slides[i].leftBottomX  = (-0.0); slides[i].leftBottomY  = (-0.0); slides[i].leftBottomZ  = (-1.00);
        loadPoli( gl, 1000+i, slides[i] );
        
        slides[i].rightTopX    = (+1.0); slides[i].rightTopY    = (+1.0); slides[i].rightTopZ    = (-1.00);
        slides[i].leftTopX     = (+1.0); slides[i].leftTopY     = (+1.0); slides[i].leftTopZ     = (-0.70);
        slides[i].rightBottomX = (+1.0); slides[i].rightBottomY = (-0.0); slides[i].rightBottomZ = (-1.00);
        slides[i].leftBottomX  = (+1.0); slides[i].leftBottomY  = (-0.0); slides[i].leftBottomZ  = (-0.70);
        loadPoli( gl, 2000+i, slides[i] );

        slides[i].rightTopX    = (+1.0); slides[i].rightTopY    = (+1.0); slides[i].rightTopZ    = (-1.00);
        slides[i].leftTopX     = (+0.0); slides[i].leftTopY     = (+1.0); slides[i].leftTopZ     = (-1.00);
        slides[i].rightBottomX = (+1.0); slides[i].rightBottomY = (+1.0); slides[i].rightBottomZ = (-0.70);
        slides[i].leftBottomX  = (+0.0); slides[i].leftBottomY  = (+1.0); slides[i].leftBottomZ  = (-0.70);
        loadPoli( gl, 3000+i, slides[i] );

        slides[i].rightTopX    = (+1.0); slides[i].rightTopY    = (+0.0); slides[i].rightTopZ    = (-1.00);
        slides[i].leftTopX     = (+0.0); slides[i].leftTopY     = (+0.0); slides[i].leftTopZ     = (-1.00);
        slides[i].rightBottomX = (+1.0); slides[i].rightBottomY = (+0.0); slides[i].rightBottomZ = (-0.70);
        slides[i].leftBottomX  = (+0.0); slides[i].leftBottomY  = (+0.0); slides[i].leftBottomZ  = (-0.70);
        loadPoli( gl, 4000+i, slides[i] );
    }
    
    // 地面の画像と場所をセット
    loadTexture( gl, 10000, backgroundImages[0] );
    for( var x=0 ; x<=MAX_X ; x++ ) {
        for( var z=0 ; z<=MAX_Z ; z++ ) {
            backgroundImages[0].x            = x;
            backgroundImages[0].y            = 0.0;
            backgroundImages[0].z            = z;
            backgroundImages[0].rightTopX    = (+1.0); backgroundImages[0].rightTopY    = (+0.0); backgroundImages[0].rightTopZ    = (+1.0);
            backgroundImages[0].leftTopX     = (-0.0); backgroundImages[0].leftTopY     = (+0.0); backgroundImages[0].leftTopZ     = (+1.0);
            backgroundImages[0].rightBottomX = (+1.0); backgroundImages[0].rightBottomY = (-0.0); backgroundImages[0].rightBottomZ = (+0.0);
            backgroundImages[0].leftBottomX  = (-0.0); backgroundImages[0].leftBottomY  = (-0.0); backgroundImages[0].leftBottomZ  = (+0.0);
            loadPoli( gl, 10000+x+z*50, backgroundImages[0] );
        }
    }
    
    // 壁
    loadTexture( gl, 20000, backgroundImages[1] );
    for( var x=1 ; x<=MAX_X ; x++ ) {
        for( var z=0 ; z<=0 ; z++ ) {
            backgroundImages[1].x            = x;
            backgroundImages[1].y            = 0.0;
            backgroundImages[1].z            = 0;
            backgroundImages[1].rightTopX    = (+1);
            backgroundImages[1].rightTopY    = (+20.0);
            backgroundImages[1].rightTopZ    = (+0.0);
            backgroundImages[1].leftTopX     = (-0.0);
            backgroundImages[1].leftTopY     = (+20.0);
            backgroundImages[1].leftTopZ     = (+0.0);
            backgroundImages[1].rightBottomX = (+1);
            backgroundImages[1].rightBottomY = (-0.0);
            backgroundImages[1].rightBottomZ = (+0.0);
            backgroundImages[1].leftBottomX  = (-0.0);
            backgroundImages[1].leftBottomY  = (-0.0);
            backgroundImages[1].leftBottomZ  = (+0.0);
            loadPoli( gl, 20000+x+z*50, backgroundImages[1] );
        }
    }
    

    
    // テクスチャインデックス（＝テクスチャ内の画像情報のマップ方法）を初期化なのです！
    // 画像のマップ先 x 画像の角の数（固定で４つ） 分の二次元情報を、一次元配列で無理やり定義する
    var texcoords = [
        1, 0, // テクスチャの右上をポリゴンの頂点の右上とひもづける
        0, 0, // テクスチャの左上をポリゴンの頂点の左上とひもづける
        1, 1, // テクスチャの右下をポリゴンの頂点の右下とひもづける
        0, 1, // テクスチャの左下をポリゴンの頂点の左下とひもづける
    ];
    texint = gl.createBuffer(); // テクスチャ用インデックスのバッファとして扱うメモリの容量を作る
    gl.bindBuffer(gl.ARRAY_BUFFER, texint); // バッファをロードすることをビデオカードに伝える
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW); // データをロード
    // 配列は1次元で渡したので、二次元情報として扱えるように縦幅・横幅を指定する
    texint.itemSize = 2; // 配列の横幅
    texint.numItems = 4; // 縦幅
    
    gl.bindBuffer(gl.ARRAY_BUFFER, null); // ビデオカードへの指示をリセット
    
    
    ///////////////////////////////////////////////////////////////////////////////
    // カメラだって初期化なのです！
    uViewMatrix = gl.getUniformLocation( gl.program, 'uViewMatrix' ); // カメラ用マトリクスインタフェースを取得
    workCamera( gl, canvas );
    

    ///////////////////////////////////////////////////////////////////////////////
    // キー入力のイベント初期化
    document.addEventListener( 'keydown', keyOnDown, false );
    document.addEventListener( 'keyup', keyOnUp, false );

    
    return gl; // WebGLへのアクセスインタフェースをリターン
  };


  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // 素材のロード処理
  var loadTexture = function( gl, no, item ) {
    // テクスチャ(画像)の初期化なのです！
    texs[no] = gl.createTexture(); // テクスチャと呼ばれる、画像のような色情報が詰まったデータを扱うメモリの容器を作る
    texs[no].image = new Image(); // 画像を扱うためのメカニズムをロード
    texs[no].image.onload = function() { // ネット上から取得した後に行う処理を指定
        gl.bindTexture(gl.TEXTURE_2D, texs[no]); // テクスチャは2D型のデータとして、ロードすることをビデオカードに伝える
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texs[no].image); // 画像をフォーマット指定してロードする
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);    // 今は
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);    // とりあえず
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); // おまじない
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); // だと思ってて！！（説明が面倒なだけか）
        gl.bindTexture(gl.TEXTURE_2D, null);
    }
    texs[no].image.src = item.imgUrl; // ロードする画像を指定して、上記の処理を開始させる
  }
  var loadPoli = function( gl, no, item ) {
    // バーテックスインデックス（＝ポリゴンの位置情報）を初期化なのです！
    // ポリゴンの位置(＝頂点) x 頂点数 分の２次元情報を、１次元配列で無理やり定義する
    var vertices = [
        item.x+item.rightTopX   , item.y+item.rightTopY   , item.z+item.rightTopZ   , // 右上 x軸, y軸, z軸
        item.x+item.leftTopX    , item.y+item.leftTopY    , item.z+item.leftTopZ    , // 左上 x軸, y軸, z軸
        item.x+item.rightBottomX, item.y+item.rightBottomY, item.z+item.rightBottomZ, // 右下 x軸, y軸, z軸
        item.x+item.leftBottomX , item.y+item.leftBottomY , item.z+item.leftBottomZ   // 左下 x軸, y軸, z軸
    ];
    vertints[no] = gl.createBuffer(); // バーテックス用インデックス（ポリゴンの頂点の位置）のバッファとして扱うメモリの容器を作る
    gl.bindBuffer(gl.ARRAY_BUFFER, vertints[no]); // バッファをロードすることをビデオカードに伝える
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW); // データをロード
    // 配列は1次元で渡したので、二次元情報として扱えるように縦幅・横幅を指定する
    vertints[no].itemSize = 3; // 配列の横幅、つまり１つのポリゴンの位置情報（＝頂点）を表現するのに使う配列の大きさを指定
    vertints[no].numItems = 4; // 配列の縦幅、つまりポリゴンの頂点の数を指定

  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // カメラの制御
  var workCamera = function(gl, canvas) {
    var viewMatrix = lookAt( // 一旦Float型の配列で初期化
        0.50+xPos, 0.50+0.00+yPos, 0.70+zPos,
        0.50+xPos, 0.50+0.00+yPos, 0.00+zPos,
        0.00     , 1.00+0.00, 0.00
    );
    viewMatrix = frustum( canvas, viewMatrix );
    gl.uniformMatrix4fv( uViewMatrix, false, viewMatrix );
    return viewMatrix;
  };

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // キー操作の制御
  var keyLeft  = false;
  var keyRight = false;
  var keyUp    = false;
  var keyDown  = false;

  var keyOnDown = function ( event ) {
      if( event.keyCode == 37 ) {
          keyLeft = true;
      }
      if( event.keyCode == 38 ) {
          keyUp = true;
      }
      if( event.keyCode == 39 ) {
          keyRight = true;
      }
      if( event.keyCode == 40 ) {
          keyDown = true;
      }
  };
  var keyOnUp = function ( event ) {
      if( event.keyCode == 37 ) {
          keyLeft = false;
      }
      if( event.keyCode == 38 ) {
          keyUp = false;
      }
      if( event.keyCode == 39 ) {
          keyRight = false;
      }
      if( event.keyCode == 40 ) {
          keyDown = false;
      }
  };

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // 透視投影処理を有効にする
  var frustum = function( canvas, here ) {
      
      // 透視投影処理のパラメータ
      var fovy   = 45;
      var aspect = canvas.clientWidth / canvas.clientHeight;
      var near   = 0.0001
      var far    = 100.0
      
      var e, rd, s, ct;
      fovy = Math.PI * fovy / 180 / 2;
      s = Math.sin(fovy);
      rd = 1 / (far - near);
      ct = Math.cos(fovy) / s;
      
      e = new Float32Array([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]);
      e[0]  = ct / aspect;
      e[1]  = 0;
      e[2]  = 0;
      e[3]  = 0;

      e[4]  = 0;
      e[5]  = ct;
      e[6]  = 0;
      e[7]  = 0;

      e[8]  = 0;
      e[9]  = 0;
      e[10] = -(far + near) * rd;
      e[11] = -1;

      e[12] = 0;
      e[13] = 0;
      e[14] = -2 * near * far * rd;
      e[15] = 0;
      
      // concat
      var i, a, b, ai0, ai1, ai2, ai3;
      a = e;
      b = here;
      
      // eとbが同じ場合、bの内容を一時的な配列にコピーする
      if (e === b) {
          b = new Float32Array(16);
          for (i = 0; i < 16; ++i) {
              b[i] = e[i];
          }
      }
      
      for (i = 0; i < 4; i++) {
          ai0=a[i];  ai1=a[i+4];  ai2=a[i+8];  ai3=a[i+12];
          e[i]    = ai0 * b[0]  + ai1 * b[1]  + ai2 * b[2]  + ai3 * b[3];
          e[i+4]  = ai0 * b[4]  + ai1 * b[5]  + ai2 * b[6]  + ai3 * b[7];
          e[i+8]  = ai0 * b[8]  + ai1 * b[9]  + ai2 * b[10] + ai3 * b[11];
          e[i+12] = ai0 * b[12] + ai1 * b[13] + ai2 * b[14] + ai3 * b[15];
      }
      
      return e;
  };

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // カメラが向く方向をセットされた配列を返す
  var lookAt = function( 
      positionX, positionY, positionZ , // カメラはどこにいるか
      targetX  , targetY  , targetZ   , // カメラはどっちの方向を向いているか
      upperX   , upperY   , upperZ      // カメラの上方向はどこか(MAXは1.0)
  ) {
      var e, fx, fy, fz, rlf, sx, sy, sz, rls, ux, uy, uz;

      // カメラの位置を起点としてどっちを向いているか出す
      fx = targetX - positionX;
      fy = targetY - positionY;
      fz = targetZ - positionZ;

      // 距離という概念を消して、1をMAXとした方向を表す値に直す
      rlf = 1 / Math.sqrt(fx*fx + fy*fy + fz*fz);
      fx *= rlf;
      fy *= rlf;
      fz *= rlf;

      // 上方向がどちらかという情報を含めて、外積を計算する
      sx = fy * upperZ - fz * upperY;
      sy = fz * upperX - fx * upperZ;
      sz = fx * upperY - fy * upperX;

      // 1をMAXとした方向を表す値に直す
      rls = 1 / Math.sqrt(sx*sx + sy*sy + sz*sz);
      sx *= rls;
      sy *= rls;
      sz *= rls;

      // 全部をまとめて、外積を計算
      ux = sy * fz - sz * fy;
      uy = sz * fx - sx * fz;
      uz = sx * fy - sy * fx;

      // 結果をfloat型配列に入れる
      e = new Float32Array([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]);
      e[0] = sx;
      e[1] = ux;
      e[2] = -fx;
      e[3] = 0;

      e[4] = sy;
      e[5] = uy;
      e[6] = -fy;
      e[7] = 0;

      e[8] = sz;
      e[9] = uz;
      e[10] = -fz;
      e[11] = 0;

      e[12] = 0 + e[0] * (-positionX) + e[4] * (-positionY) + e[8]  * (-positionZ);
      e[13] = 0 + e[1] * (-positionX) + e[5] * (-positionY) + e[9]  * (-positionZ);
      e[14] = 0 + e[2] * (-positionX) + e[6] * (-positionY) + e[10] * (-positionZ);
      e[15] = 1 + e[3] * (-positionX) + e[7] * (-positionY) + e[11] * (-positionZ);
      
      return e;
  };

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // 動作処理
  var work = function() {
    if( keyLeft ) {
      targetX   -= 0.04;
    }
    if( keyRight ) {
      targetX   += 0.04;
    }
    if( keyUp ) {
      targetY   += 0.04;
    }
    if( keyDown ) {
      targetY   -= 0.04;
    }
    
    var countX = targetX - xPos;
    var countY = targetY - yPos;
    var countZ = targetZ - zPos;
    
    xPos += countX/12;
    yPos += countY/12;
    zPos += countZ/12;
  };

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // レンダリング
  var render = function(gl) {
    
    // 現在の画面上のCanvasエリアのサイズに合わせて、表示領域の大きさを変える
    if (canvas.clientWidth == null || canvas.clientHeight == null ) {
      return;
    }
    cvwidth = canvas.clientWidth; // 画面上のCanvasエリアの横幅
    cvheight = canvas.clientHeight; // 画面上のCanvasエリアの縦幅
    gl.viewport(0, 0, cvwidth, cvheight); // ビューポートを作る 左上のx位置, 左上のy位置, 右下のx位置, 右下のy位置
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // 背景色と深度バッファをクリアする
    
    // カメラの位置（ワールド座標上での位置）をセット
    workCamera( gl, canvas );
    
    // スライドの描画
    for( var i=0 ; i<slides.length ; i++ ) {
        renderPoli( gl, vertints[i]     , texs[i]    );
        renderPoli( gl, vertints[i+1000], texs[1000] );
        renderPoli( gl, vertints[i+2000], texs[1000] );
        renderPoli( gl, vertints[i+3000], texs[1000] );
        renderPoli( gl, vertints[i+4000], texs[1000] );
    }

    // 地面の描画
    for( var i=10001 ; i<12500 ; i++ ) {
        renderPoli( gl, vertints[i], texs[10000] );
    }
    // 壁の描画
    for( var i=20001 ; i<(20000+MAX_X) ; i++ ) {
        renderPoli( gl, vertints[i], texs[20000] );
    }

    // 描画実行なのです！
    gl.flush();
    
  };

  var renderPoli = function( gl, vertint, tex ) {
        // バーテックスインデックスからポリゴンの位置を指示
        gl.bindBuffer(gl.ARRAY_BUFFER, vertint); // ←vertintに初期値が既に設定されているので、バッファにセットするだけでOK
        gl.vertexAttribPointer(0, vertint.itemSize, gl.FLOAT, false, 0, 0); // ビデオカードのメモリ上へ書き出す
        // テクスチャインデックスからテクスチャの位置を指示
        gl.bindBuffer(gl.ARRAY_BUFFER, texint); // ←texintに初期値が既に設定されているので、バッファにセットするだけでOK
        gl.vertexAttribPointer(1, texint.itemSize, gl.FLOAT, false, 0, 0); // ビデオカードのメモリ上へ書き出す
        // 色情報をテクスチャから読み込む
        gl.bindTexture(gl.TEXTURE_2D, tex); // ←texに初期値が既に設定されているので、バッファにセットするだけでOK
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, texint.numItems); // ビデオカードのメモリ上へ書き出す
  }

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // ゲームループ
  var gameLoop = function(gl) {
      work();
      render(gl);
      controlFrame(function(){gameLoop(gl);});
  };

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // ゲームスクリプトのエントリーポイント
  var main = function() {

    body = document.querySelector("body");
    sections = document.querySelectorAll("section");
    for( var i=0,length=sections.length; i<length ; i++ ) {
      var section = sections[i];
      slides[i] = {
        x : parseFloat(section.getAttribute("wg-x")),
        y : parseFloat(section.getAttribute("wg-y")),
        z : parseFloat(section.getAttribute("wg-z")),
        imgUrl : section.getAttribute("wg-img")
      };
    }

    targetX = parseInt(body.getAttribute("wb-begin-x"));
    targetY = parseInt(body.getAttribute("wb-begin-y"));
    targetZ = parseInt(body.getAttribute("wb-begin-z"));

    // 描画領域のサイズを定義
    resizeWindow();
    
    // ゲームエンジンの起動とゲームループの開始
    var gl = init(canvas);
    gameLoop(gl);

    body.appendChild(canvas);
    
  };

  var resizeWindow = function(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cvwidth = canvas.width;
    cvheight = canvas.height;    
  }

  document.addEventListener("DOMContentLoaded",main,false);
  window.addEventListener("resize",resizeWindow,false);


})();
