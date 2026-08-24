# 8443 过渡方案：绕过备案拦截的 IAP 验签部署

## 为什么是 8443

`verify.haoweimedia.com` 解析到上海腾讯云（124.221.168.96），**未备案**。
腾讯云对未备案域名的 **80/443 入站一律 webblock 拦截**（无论 iPhone、浏览器还是苹果发起）。
但**非标端口（如 8443）默认不拦**，且 iOS ATS 只要求「HTTPS + 正规证书」，不限制端口必须是 443。

因此用 `https://verify.haoweimedia.com:8443/api/verify-iap` 即可在原服务器上继续用 server.js 验签，
绕开备案拦截。这是**过渡方案**：等 ICP 备案通过或购入香港轻量后，一行配置即可回 443。

> App 端 `mytool/src/iap/iap.js` 的 `VERIFY_API` 已改为 `https://verify.haoweimedia.com:8443/api/verify-iap`。
> **务必先在本机确认服务器 8443 已通（见第五步），再重打 build 发版**，否则购买后验签失败、解锁不了。

---

## 前置条件

1. 域名已解析：`verify.haoweimedia.com` A → `124.221.168.96`（DNSPod / 腾讯云 DNS 控制台）。
2. 持有 **DNSPod API 凭证**（DP_Id / DP_Key）。获取路径：
   DNSPod 控制台 → 用户中心 → 安全设置 → API 密钥；或在腾讯云「访问管理 → API 密钥」获取。
3. 能登录**腾讯云控制台**修改 CVM 安全组。
4. 能 SSH 登录服务器（root），本手册命令均在服务器上以 root 执行。

---

## 第一步：腾讯云安全组放行 8443（控制台，必须）

1. 腾讯云控制台 → 云服务器 CVM → **安全组** → 找到绑定 `124.221.168.96` 的安全组。
2. **入站规则** → 添加规则：
   - 协议端口：`TCP:8443`
   - 来源：`0.0.0.0/0`（或收紧为 App 用户网段）
   - 策略：允许
3. 保存。安全组与系统防火墙是两层，都要放。

## 第二步：系统防火墙放行 8443

```bash
firewall-cmd --permanent --add-port=8443/tcp
firewall-cmd --reload
# 确认
firewall-cmd --list-ports | grep 8443
```

## 第三步：用 acme.sh + DNSPod 签发证书（DNS-01，绕开 80 被拦）

certbot 的 HTTP-01 验证需要 80 端口可被 ACME 服务器回连 —— 但 80 被备案拦死，**HTTP-01 做不了**。
改用 **DNS-01**：acme.sh 通过 DNSPod API 自动加 TXT 记录完成验证，完全不经过 80/443。

```bash
# 1. 安装 acme.sh
curl https://get.acme.sh | sh
source ~/.bashrc

# 2. 填入 DNSPod 凭证（仅当前 shell 生效，不会写入代码库）
export DP_Id="你的_DNSPod_ID"
export DP_Key="你的_DNSPod_Token"

# 3. 签发证书（只签 verify 即可；如需 www 一并加 -d www.haoweimedia.com）
~/.acme.sh/acme.sh --issue --dns dns_dp -d verify.haoweimedia.com

# 4. 把证书安装到固定路径（nginx 引用此路径；回 443 时复用，无需重签）
~/.acme.sh/acme.sh --install-cert -d verify.haoweimedia.com \
  --key-file       /etc/letsencrypt/live/verify.haoweimedia.com/privkey.pem \
  --fullchain-file /etc/letsencrypt/live/verify.haoweimedia.com/fullchain.pem \
  --reloadcmd      "systemctl reload nginx"
```

> DNS-01 续期同样不经过 80，acme.sh 的 cron 会自动续期，不受备案拦截影响。
> 请确保服务器 crond 常驻：`systemctl enable --now crond`。

## 第四步：nginx 改用 8443 ssl 块

用本目录的 `nginx-verify-8443.conf` 替换原 `evareel.conf` 里的 verify 段：

```bash
# 编辑现有配置，把原 80 的 verify 块整体替换为 8443 ssl 块
vi /etc/nginx/conf.d/evareel.conf
# （把 server { listen 80; server_name verify.haoweimedia.com; ... } 整段
#   替换为 nginx-verify-8443.conf 的内容）

# 校验并重载
nginx -t && systemctl reload nginx
```

> 若 prefer 独立文件：直接 `cp nginx-verify-8443.conf /etc/nginx/conf.d/verify-8443.conf`，
> 并删掉原 evareel.conf 里的 verify 80 块（避免 server_name 重复冲突）。

确认 pm2 里的 server.js 仍在跑（监听 3000）：

```bash
pm2 status evareel-verify
# 若未跑：cd /opt/evareel-server && pm2 start server.js --name evareel-verify
```

## 第五步：本机确认 8443 已通（发版前必做）

在能访问公网的机器上（非服务器本机）执行：

```bash
curl -k https://verify.haoweimedia.com:8443/health
# 期望返回: {"ok":true,"app":"evareel-iap-verify","env":"SANDBOX"}
```

返回 200 + JSON 即链路通。**此时再重打 App build 发版。**

---

## 回 443（备案通过 / 购香港机后）

1. **App 端**：`mytool/src/iap/iap.js` 的 `VERIFY_API` 改回
   `https://verify.haoweimedia.com/api/verify-iap`（去掉 `:8443`），重打 build。
2. **nginx**：把 `listen 8443 ssl;` 改为 `listen 443 ssl;`（证书路径不变），`nginx -t && reload`。
3. **安全组**：放行 443（备案后 443 入站自然合法，但安全组仍需允许）。
4. （可选）删掉 8443 安全组规则与 nginx 8443 块。

---

## 风险与运维

- **收紧风险**：腾讯云可能把非标端口也纳入备案拦截（趋势），届时 8443 也会被拦 → 立刻切香港机或等备案。
- **证书续期**：DNS-01 续期不受 80 拦影响，但依赖 acme.sh cron 常驻；服务器重置/迁移后需重新 install-cert。
- **人工维护**：证书续期、域名到期、服务器搬家全链路都要人工跟，无法像 443 那样 certbot 全自动省心。
- **ATS 合规**：8443 用正规 CA 证书（Let's Encrypt），ATS 接受，**无需** `NSAllowsArbitraryLoads`；若误用自签/无效证书，ATS 会直接拒绝。
- **长期建议**：仅在过渡期使用；正式上线优先香港轻量（¥24-34/月，端口规范、链路正统）或完成 ICP 备案。
