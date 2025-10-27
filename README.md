# Before everything, you should know:
1. **This script does not impair the integrity of eLuna or any other systems of the Organization.** All it does is to grab the active segment and its term pairs shown on your eLuna page, combine them with the prompt set by you, send them to a large language model (LLM) server for translation, and show the translation on the page when the server has responded.
2. **Why use this script?** It increases the accuracy of terminology (to some extent), because the active segment and its term pairs are provided to the LLM, which will use the term pairs in its translation. Also, it increases efficiency because you don’t have to copy and paste when you need a translation from AI chatbots. 
3. **Lower your expectations.** Since the output of a LLM depends on (a) the LLM itself and its billions of parameters, (b) the prompt, and (c) the input, you will not be guaranteed a good accurate translation each and every time you use it. In other words, any combination of those three factors will bring a different result, and thus there is _no one-size-fits-all solution in terms of LLM choice and prompt engineering_. One known issue is that because the segment and its term pairs are provided out of context, the LLM may choose an incorrect term for your translation.  
4. **You will have to pay a little to the LLM provider.** The charges of an LLM provider are based on usage, measured in tokens. Both inputs (including your prompt) and outputs are charged. DeepSeek charges ¥2 per million input tokens and ¥3 per million output tokens. Very roughly estimated, _a typical day’s translation workload might cost around ¥0.1_ under DeepSeek’s pricing. However, this estimation may vary in accordance with actual usage.
# If you want to try it out, follow these steps:
## Get an API key from DeepSeek
1. Visit [**DeepSeek开放平台**](https://platform.deepseek.com), create an account, and sign in
2. Click [**API Keys**](https://platform.deepseek.com/api_keys) on the left side of the page
3. Click `创建API Key`, enter any name for the API, and click `创建`
4. Copy and save the generated API key in a secure place
## Install the TamperMonkey extension
1. If you are using the Chrome browser, click: [https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
2. If you are using the Edge browser, click: [https://microsoftedge.microsoft.com/addons/detail/%E7%AF%A1%E6%94%B9%E7%8C%B4/iikmkjmpaadaobahmlepeloendndfphd?hl=zh-CN](https://microsoftedge.microsoft.com/addons/detail/%E7%AF%A1%E6%94%B9%E7%8C%B4/iikmkjmpaadaobahmlepeloendndfphd?hl=zh-CN)
3. On the page, click the `Install` or`Get` button to complete the installation.
## Install the TransAsst script
1. Click [https://github.com/ls8215/CopyAsst/raw/refs/heads/main/TransAsst.user.js](https://github.com/ls8215/CopyAsst/raw/refs/heads/main/TransAsst.user.js)
2. Then click the `Install` button
## Open the browser Developer Mode
1. If you are using the Edge browser, copy `edge://extensions` into the browser address bar, press `Enter` on your keyboard, and turn on `Developer mode` in the left sidebar of the page.
2. If you are using the Chrome browser, copy `chrome://extensions` into the browser address bar, press `Enter` on your keyboard, and turn on `Developer mode` in the upper right corner of the page.
## Open the script settings page
1. **Go to eLuna** and open any document that you are transalting or have translated
2. Now look at the** top-right corner of the toolbar** (next to the address bar), and you should see a small puzzle-piece icon — for Chrome:<img width="30" height="30" alt="image" src="https://github.com/user-attachments/assets/72007362-c1e8-4afd-a57a-500c5f8c81e2" />
; and for Edge:<img width="30" height="30" alt="image" src="https://github.com/user-attachments/assets/f7577078-ca80-4e0f-abb2-a15d999eef0f" />
3. Click the puzzle-piece icon to open the list of installed extensions. Now you should see the TamperMoneky extension (To make it always visible, click the pin icon to the right): <img width="280" height="40" alt="image" src="https://github.com/user-attachments/assets/894096e1-6031-4e80-81b7-2c5667495615" />
4. Click the TamperMonkey icon to see the installed scripts. Here you should see our TransAsst:<br>
   <img width="318" height="244" alt="image" src="https://github.com/user-attachments/assets/87bbdaed-55a1-4ee2-b7a8-28f4adfe1c9e" />
5. Click `Open TransAsst Settings` to open the settings page
## Configure the script in the settings page:
1. `API Key`: Enter the API key from DeepSeek
2. `Model`: For now only `deepseek-chat` is supported
3. `System Prompt`: Enter your customized propmpt for translation.
   - Since we only need the translation from the LLM, it's better to use this rule: `请直接输出译文，不要做解释、分析或讨论。`
   - Since the script provides a list of term pairs when requesting translation, you should consider adding a constraint into your prompt, such as: `**严格使用用户提供的术语**，如果用户提供的术语对应多个译法，要结合句子从中选择最合适的译法。`
   - Rules related to numbers and punctuations will be helpful too, such as：`**符合标点和数字规范。** - **使用半角括号()**，严禁使用全角括号（）。 - 纯属计量或统计的数字一律用阿拉伯数字表示，数字分组以空格代替逗号，万以上用“万”“亿”等中文单位，百分数并列时“%”不省，例如：**123,456,023 → 123 456 023；fifty million → 5 000万；1-2 per cent → 1%-2 %；five percentage points → 5个百分点。**`
5. `Project Rules`: Here you can specify your rules for certain types of projects
   - For example, if you are translation a SR document, you may add such rules as: `句首人名不翻译；said翻译成“说”`.
7. `Temperature`: Yu can tweak this figure to see if the result meets your expection. The lower this figure is, the less random and creative the result will be. For translation, a figure between 1 to 1.3 will be a reasonable. 
8. `Top_p`: Let's keep this figure unchanged.
9. `Max tokens`: You don't need to change this figure either. Default to 2000. 
# Possible Todo’s
1. Support models from other LLM providers like OpenAI, if they are not much more expensive
2. Provide context by sending the current segment plus several preceding and following segments to the LLM, if this helps improve translation quality.
