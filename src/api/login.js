import service from "@/utils/request.js";
/**
 * 获取验证码
 */
export function GetSms() {
    service.request({
        method: "post",
        url: "/api/getSms",
        data: {}
    })
}

export function GetSms2() {
    service.request({
        method: "post",
        url: "/devApi/getSms",
        data: {}
    })
}

/**
 * 获取用户角色
 */

/**
 * 登陆
 */

/**
 * 注册
 */