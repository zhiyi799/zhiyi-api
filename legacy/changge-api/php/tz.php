<?php
$jsonString = file_get_contents('main.json');
$data = json_decode($jsonString, true);
$id = isset($_GET['id']) ? $_GET['id'] : null;

$apiInfo = null;
foreach ($data['data'] as $api) {
    if ($api['id'] == $id) {
        $apiInfo = $api;
        break;
    }
}
$yu = $data["config"]["link"];
if ($apiInfo) {
    $name = htmlspecialchars($apiInfo['name']);
    $desc = htmlspecialchars($apiInfo['desc']);
    $link = htmlspecialchars($apiInfo['link']);
    $paramsHtml = '';

    foreach ($apiInfo['can'] as $param) {
        $paramName = htmlspecialchars($param['1']);
        $paramType = htmlspecialchars($param['2']);
        $paramRequired = htmlspecialchars($param['3']);
        $paramDesc = htmlspecialchars($param['4']);
        $paramsHtml .= "<tr>
            <td>$paramName</td>
            <td>$paramType</td>
            <td>$paramRequired</td>
            <td>$paramDesc</td>
        </tr>";
    }
    
    $lin=$yu.$link;

    $html = <<<HTML
<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, -scale=1.0">
    <title>API文档</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/css/bootstrap.min.css">
    <style>
      body {
    background-image: url("bj.png");
    background-repeat: no-repeat;
    background-size: cover;
  }
        a:hover {
            text-decoration: underline;
        }
        .mt-4{
            color:pink;
            font-family: "MyFont", sans-serif;
        }
        .mb-4{
            color:#333;
            font-family: "MyFont", sans-serif;
        }
        .mz-4{
            color:#333;
            font-family: "MyFont", sans-serif;
        }
        
        .my-4{
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
            font-family: "MyFont", sans-serif;
        }
        @font-face {
            font-family: 'MyFont'; /* 自定义字体的名称 */
            src: url('fonts/words4.ttf') format('truetype'); /* 字体文件的路径和格式 */
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="my-4">$name<br><pre>API文档</h1>
        <p class="mb-4">欢迎来到我们的API文档页面，这里包含了所有可用的API接口地址、接口示例地址以及各个参数的介绍。</p>
        
        <h2 class="mz-4"><a href="" style="text-decoration: none;">#</a>介绍</h2>
           <h3 class="my-4"><pre>$desc</pre></h3>
           
        <h2 class="mt-4"><a href="" style="text-decoration: none;">#</a>API接口地址</h2>
        <ul class="list-group">
            <li class="list-group-item"><a href="$lin" style="text-decoration: none;">$lin</a></li>
        </ul>

        <h2 class="mt-4"><a href="" style="text-decoration: none;">#</a>详细参数</h2>
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>参数</th>
                    <th>类型</th>
                    <th>必填</th>
                    <th>描述</th>
                </tr>
            </thead>
            <tbody>
                $paramsHtml
            </tbody>
        </table>
        <br>
            <br>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
HTML;

    echo $html;
} else {
    echo "🐔了";
}
?>