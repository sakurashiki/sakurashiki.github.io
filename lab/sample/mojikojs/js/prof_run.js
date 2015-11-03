/* 名前パスの補完 */
(function(){
    $article = $("article");
    $article.attr("mjk-img-bg-prefix","img/background/");
    $article.attr("mjk-img-bg-postfix",".jpg");
    $article.attr("mjk-img-ch-prefix","img/charactors/");
    $article.attr("mjk-img-ch-postfix",".png");
    $article.attr("mjk-img-cg-prefix","img/cg/");
    $article.attr("mjk-img-cg-postfix",".jpg");
    $article.attr("mjk-img-sd-prefix","img/sd/");
    $article.attr("mjk-img-sd-postfix",".jpg");
    $article.attr("mjk-img-ef-prefix","img/effect/");
    $article.attr("mjk-img-ef-postfix",".png");
    
    $article.attr("mjk-sound-voice-prefix","sound/voice/");
    $article.attr("mjk-sound-voice-postfix",".mp3");
    $article.attr("mjk-sound-se-prefix","sound/se/");
    $article.attr("mjk-sound-se-postfix",".mp3");
    $article.attr("mjk-sound-bgm-prefix","sound/bgm/");
    $article.attr("mjk-sound-bgm-postfix",".mp3");
    $article.attr("mjk-sound-loopse-prefix","sound/loopse/");
    $article.attr("mjk-sound-loopse-postfix",".mp3");

    $article.attr("mjk-mov-prefix","mov/");
    $article.attr("mjk-mov-postfix",".mp4");

    var list = [];

})();

