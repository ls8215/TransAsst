# CopyAsst 使用说明

## 一、功能说明
**CopyAsst** 的核心功能是帮助用户快速提取并复制当前句段的原文和术语。  
1. **提取原文**  
   自动识别当前页面中激活的句段，获取英文原文文本。
2. **提取术语**  
   提取页面上已经匹配出来的术语。
3. **整合内容**  
   将提取到的原文与术语对组合起来，写入系统剪贴板。方便粘贴到在大语言模型对话窗口。

## 二、怎么使用
1. 安装TamperMonkey（篡改猴）扩展
- 如果使用Chrome浏览器，点击：https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo
- 如果使用Edge浏览器，点击：https://microsoftedge.microsoft.com/addons/detail/%E7%AF%A1%E6%94%B9%E7%8C%B4/iikmkjmpaadaobahmlepeloendndfphd?hl=zh-CN
- 在页面中点击“**安装**”或“**获取**”按钮，即可安装成功
2. 安装**CopyAsst**脚本
- 点击：https://github.com/ls8215/CopyAsst/raw/refs/heads/main/CopyAsst.user.js
- 点击“**安装**”按钮
3. 打开浏览器开发者模式
- 如果使用Edge浏览器，复制```edge://extensions```到浏览器地址栏，在键盘上按下**回车键**，在页面**左边栏**打开**开发人员模式**。
- 如果使用Chrome浏览器，复制```chrome://extensions```到浏览器地址栏，在键盘上按下**回车键**，在页面**右上角**打开**开发者模式**。
4. 在eLuna中使用该脚本
- 随意选中一个句段，点击译文栏，点击**show more**
- 在术语表右边上下箭头的下方，有一个新增的按钮，点击即可将原文和术语复制到剪贴板。见下图：
  <img width="788" height="341" alt="image" src="https://github.com/user-attachments/assets/bd903ea0-9260-45ec-9c40-2fdf3c550c8b" />

## 三、安全说明
**CopyAsst** 是一个纯前端的浏览器辅助脚本，它不会上传、存储或修改任何用户数据。所有操作都在本地浏览器中完成。
### 本脚本会做的事
- 在用户点击按钮时，从当前页面提取**已显示的原文和术语**。  
- 将这些信息整理并**复制到剪贴板**，方便后续使用。  
### 本脚本不会做的事
- 不会访问任何外部服务器；  
- 不会收集或上传登录凭证、Cookie、账号等隐私数据；  
- 不会修改网页内容或任何后台内容。



