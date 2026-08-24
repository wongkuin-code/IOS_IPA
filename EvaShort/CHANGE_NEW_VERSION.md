# 换版本 + 换账号：待变更 ID 记录

> 目标：App 换为全新身份（新名称 / 新 bundleId / 新版本号），提交到另一个 Apple Developer 账号。
> 以下列出所有需要变更的位置与当前值，拿到新账号信息后统一替换。

## 一、App 身份（mytool/app.json）

| 项目 | 当前值 | 新值 |
| ---- | ------ | ---- |
| expo.name（App 显示名） | `EvaReel` | ✅ 已改为 `EvaShort` |
| expo.slug | `duanju-novel` | ✅ 已改为 `evashort`（新账号需 `eas init` 关联） |
| expo.scheme | `evareel` | ✅ 已改为 `evashort` |
| expo.version | `1.0.0` | ✅ 保持 `1.0.0`（全新身份） |
| expo.ios.bundleIdentifier | `com.mytool.booksreader` | 待定（新账号需在 App Store Connect 创建对应 App） |
| expo.ios.buildNumber | `1` | ✅ 保持 `1`（全新身份首包） |
| expo.android.package | `com.mytool.booksreader` | 待定 |
| expo.extra.eas.projectId | `a49f46cd-54e1-4dbd-b1f6-fc8c615cb4c3` | 待定（新账号下 `eas init` 重新生成） |
| expo.owner | `wongkuins-team` | 待定（新账号的组织名 / 用户名） |

## 二、构建/提交配置（mytool/eas.json → submit.production.ios）

| 项目 | 当前值 | 新值 |
| ---- | ------ | ---- |
| ascAppId（App Store Connect App ID） | `6799368982` | 待定（新 App 创建后获得） |
| ascApiKeyId | `74AU6WRUF9` | 待定（新账号的 ASC API Key ID） |
| ascApiKeyIssuerId | `ac9f4281-658a-4b96-8a40-cebf371c26de` | 待定 |
| ascApiKeyPath | `../keys/AuthKey_74AU6WRUF9.p8` | 待定（新 p8 文件名） |

## 三、keys/ 目录（git 已忽略，不提交）

| 文件 | 当前内容 | 新值 |
| ---- | -------- | ---- |
| keys/apple-dev.txt | Apple ID: `vuthingocnga9798@icloud.com` + App 专用密码 | 待定 |
| keys/keyID.txt | `74AU6WRUF9` | 待定 |
| keys/Issuer.txt | `ac9f4281-658a-4b96-8a40-cebf371c26de` | 待定 |
| keys/AuthKey_74AU6WRUF9.p8 | ASC API 私钥 | 待定（新 p8 放入） |

## 四、工作流脚本（build-workflow.ps1）

| 项目 | 当前值 | 新值 |
| ---- | ------ | ---- |
| -Account 参数（EAS 账号名） | `wongkuins-team` | 待定 |
| -BetaGroupId（TestFlight 组） | `12a65f74-9141-4b96-b57a-c2182f69405d` | 待定（如用旧组可保留） |

## 五、根目录 app.json（旧项目 番茄助手，如不再用可忽略）

| 项目 | 当前值 | 说明 |
| ---- | ------ | ---- |
| name/slug/bundleIdentifier | `番茄助手` / `fanqie-helper` / `com.fanqie.helper` | 与 mytool 无关的旧 App |

## 六、替换检查清单

拿到新账号信息后按此顺序替换：

1. [ ] `mytool/app.json`：name / slug / scheme / version / bundleIdentifier / android.package / projectId / owner
2. [ ] `mytool/eas.json`：ascAppId / ascApiKeyId / ascApiKeyIssuerId / ascApiKeyPath
3. [ ] `keys/`：apple-dev.txt / keyID.txt / Issuer.txt / 新 p8 文件
4. [ ] `build-workflow.ps1`：Account / BetaGroupId（如需）
5. [ ] 新账号下重新 `eas login` + `eas init`（生成新 projectId）→ 重新构建上传
