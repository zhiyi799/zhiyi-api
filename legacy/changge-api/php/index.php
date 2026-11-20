<?php
$jsonFilePath = 'main.json';
if (!file_exists($jsonFilePath)) {
    die('JSON file not found.');
}
$jsonData = file_get_contents($jsonFilePath);
$data = json_decode($jsonData, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    die('Failed to parse JSON: ' . json_last_error_msg());
}
$apiNickname = $data['config']['name'] ?? 'API文档昵称';
$apiListItems = '';
if (is_array($data['data'])) {
    foreach ($data['data'] as $api) {
 $apiListItems .= '<li class="list-group-item"><a href="tz.php?id=' . $api['id'] . '" style="text-decoration: none;">' . $api['name'] . '</a></li>';
    }
} else {
    $apiListItems = '<li class="list-group-item">No APIs available.</li>';
}
$friendLinkItems = '';
if (is_array($data['link'])) {
    foreach ($data['link'] as $link) {
        $friendLinkItems .= '<li class="list-group-item"><a href="' . $link['link'] . '" style="text-decoration: none;">' . $link['name'] . '</a></li>';
    }
} else {
    $friendLinkItems = '<li class="list-group-item">No links available.</li>';
}
?>
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $apiNickname; ?> - API文档</title>
       <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="icon/qq/font-awesome/css/font-awesome.min.css">
    <link rel="stylesheet" href="icon/emil/font-awesome/css/font-awesome.min.css">
    <link rel="stylesheet" href="icon/github/font-awesome/css/font-awesome.min.css">
    <link rel="stylesheet" href="icon/circle/font-awesome/css/font-awesome.min.css">
    <link rel="stylesheet" href="icon/qrcode/font-awesome/css/font-awesome.min.css">
<style>
        a:hover {
            text-decoration: underline;
        }
    </style>
<style>
  body {
    background-image: url("bj.png");
    background-repeat: no-repeat;
    background-size: cover;
  }
  .mt-4{
   color:pink;
   font-family: "MyFont", sans-serif;
 }
  .mb-4{
   color:white;
   font-family: "MyFont", sans-serif;
 }
  .my-4{
   text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);

   font-family: "MyFont", sans-serif;
 }
@font-face {
    font-family: 'MyFont'; /* 自定义字体的名称 */
    src: url('fonts/words2.ttf') format('truetype'); /* 字体文件的路径和格式 */
}
</style>
</head>
<body>
    <div class="container">
        <h1 class="my-4"><?php echo $apiNickname; ?></h1>
        <p class="mb-4">欢迎来到我们的API文档页面，这里包含了所有可用的API接口地址、点击展示接口示例地址以及各个参数的介绍。</p>

        <h5 class="mt-4"><a href="" style="text-decoration: none;">#</a>API接口</h5>
        <ul class="list-group" id="apiList">
            <?php echo $apiListItems; ?>
        </ul>

        <h5 class="mt-4"><a href="" style="text-decoration: none;">#</a>友情链接</h5>
        <ul class="list-group" id="friendLinks">
            <?php echo $friendLinkItems; ?>
        </ul>
<div class="copyright">
        <a class="fa fa-qq" aria-hidden="true" href="http://api.caonmtx.cn/api/tzmp.php?QQ=3355236800" style="text-decoration: none;"></a>
        <a class="fa fa-envelope-o" aria-hidden="true" onclick="copyAndAlert()" style="text-decoration: none;"></a>
        <input type="text" value="3355236800@qq.com" id="copyText" class="hidden">
        <a class="fa fa-github" aria-hidden="true" href="https://github.com/cloudpoed/nb" style="text-decoration: none;"></a>
        <a class="fa fa-qrcode" aria-hidden="true" style="text-decoration: none;" href="API/qrcode/?type=url&url=http://change.bkm.asia"></a>        <i class="fa fa-info-circle" aria-hidden="true"></i>
<br>
    版权 © 2024 <a href="https://qm.qq.com/q/6PUqGOzEhU" style="text-decoration: none;">Change</a> All Rights Reserved
        <br>
        <a href="https://qm.qq.com/q/6PUqGOzEhU" style="text-decoration: none;">Change API</a>
        <br>
        </div>
<style>
.copyright {
    background-color: through;
    color: #ccc;
    padding: 30px;
    text-align: center;
}
.hidden{
    display: none;
}
</style>
    <script>
        function copyAndAlert() {
            var copyText = document.getElementById("copyText");
            copyText.select();
            document.execCommand("copy");
            alert("邮箱地址已复制 3355236800@qq.com");
        }
    </script>

    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/js/bootstrap.bundle.min.js"></script>
</body>

</html>
