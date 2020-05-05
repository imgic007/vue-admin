<template>
  <div id="login">
    <div class="login-wrap">
      <ul class="menu-tab">
        <li
          :class="{ current: item.current }"
          v-for="item in menuTab"
          @click="toggleMenu(item)"
          :key="item.id"
        >{{ item.txt }}</li>
      </ul>
      <el-form
        :model="loginForm"
        status-icon
        :rules="rules"
        ref="loginForm"
        class="login-form"
        size="medium"
      >
        <el-form-item prop="username" class="item-from">
          <label>邮箱</label>
          <el-input id type="text" v-model="loginForm.username" autocomplete="off"></el-input>
        </el-form-item>
        <el-form-item prop="password" class="item-from">
          <label>密码</label>
          <el-input
            minlength="6"
            maxlength="20"
            type="password"
            v-model="loginForm.password"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item v-show="model == 'register'" prop="passwords" class="item-from">
          <label>重复密码</label>
          <el-input
            minlength="6"
            maxlength="20"
            type="password"
            v-model="loginForm.passwords"
            autocomplete="off"
          ></el-input>
        </el-form-item>
        <el-form-item prop="code" class="item-from">
          <label>验证码</label>
          <el-row :gutter="10">
            <el-col :span="15">
              <el-input minlength="6" maxlength="6" v-model="loginForm.code"></el-input>
            </el-col>
            <el-col :span="9">
              <el-button
                :disabled="codeButtonStatus.status"
                class="block"
                @click="getSms"
                type="success"
              >{{ codeButtonStatus.text }}</el-button>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item>
          <el-button
            :disabled="loginButtonStatus"
            class="login-btn block"
            type="danger"
            @click="submitForm('loginForm')"
          >提交</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import sha1 from "js-sha1";
import { GetSms, Register, Login } from "@/api/login.js";
import { reactive, ref, isRef, toRefs, onMounted } from "@vue/composition-api";
import {
  stripscript,
  validateEmail,
  validatePass,
  validateVcode
} from "@/utils/validate.js";
export default {
  name: "login",
  // setup(props, context){
  /**
     *attrs: (...) == this.$attrs
      emit: (...) == this.$emit
      listeners: (...) == this.$listeners
      parent: (...) == this.$parent
      refs: (...) == this.$refs
      root: (...) == this
      */
  setup(props, { refs, root }) {
    const menuTab = reactive([
      { txt: "登录", current: true, type: "login" },
      { txt: "注册", current: false, type: "register" }
    ]);

    // 模块值
    const model = ref("login");
    // 登录按钮禁用状态
    const loginButtonStatus = ref(true);
    // 验证码按钮状态
    const codeButtonStatus = reactive({
      status: false,
      text: "获取验证码"
    });

    // 倒计时
    const timer = ref(null);

    // 表单的数据
    const loginForm = reactive({
      username: "798087644@qq.com",
      password: "abc123",
      passwords: "",
      code: ""
    });

    // 验证用户名
    let validateUsername = (rule, value, callback) => {
      if (value === "") {
        callback(new Error("请输入用户名"));
      } else if (validateEmail(value)) {
        callback(new Error("用户名格式有误"));
      } else {
        callback();
      }
    };

    // 更新按钮状态
    const updataButtonStatus = params => {
      codeButtonStatus.status = params.status;
      codeButtonStatus.text = params.text;
    };

    // 验证密码
    let validatePassword = (rule, value, callback) => {
      loginForm.password = stripscript(value);
      value = loginForm.password;
      if (value === "") {
        callback(new Error("请输入密码"));
      } else if (validatePass(value)) {
        callback(new Error("密码为6至20位的数字+字母"));
      } else {
        callback();
      }
    };

    // 验证重复密码
    let validatePasswords = (rule, value, callback) => {
      if (model.value == "login") {
        callback();
      }

      loginForm.passwords = stripscript(value);
      value = loginForm.passwords;

      if (value === "") {
        callback(new Error("请再次输入密码"));
      } else if (value != loginForm.password) {
        callback(new Error("重复密码不正确"));
      } else {
        callback();
      }
    };

    // 验证验证码
    let checkCode = (rule, value, callback) => {
      if (!value) {
        return callback(new Error("请输入验证码"));
      } else if (validateVcode(value)) {
        return callback(new Error("验证码格式有误"));
      } else {
        callback();
      }
    };

    const rules = reactive({
      username: [{ validator: validateUsername, trigger: "blur" }],
      password: [{ validator: validatePassword, trigger: "blur" }],
      passwords: [{ validator: validatePasswords, trigger: "blur" }],
      code: [{ validator: checkCode, trigger: "blur" }]
    });

    const toggleMenu = item => {
      menuTab.forEach(item => {
        item.current = false;
      });
      // 高光
      item.current = true;
      // 修改模块值
      model.value = item.type;
      // 重置菜单
      refs["loginForm"].resetFields();
      codeButtonStatus.text = "获取验证码";
    };

    /**
     * 获取验证码
     */

    const getSms = () => {
      // 进行提示
      if (loginForm.username == "") {
        root.$message.error("邮箱不能为空！！");
        return false;
      } else if (validateEmail(loginForm.username)) {
        root.$message.error("邮箱格式有误，请重新输入！！");
        return false;
      }
      // 获取验证码
      let requestData = {
        username: loginForm.username,
        module: model.value
      };
      // 修改获取验证按钮状态
      updataButtonStatus({
        status: true,
        text: "发送中"
      });

      // 延时多长时间
      GetSms(requestData)
        .then(response => {
          let data = response.data;
          root.$message({
            message: data.message,
            type: "success",
            dangerouslyUseHTMLString: true
          });

          loginForm.code = data.message.slice(-6);

          // 启用登录或注册按钮
          loginButtonStatus.value = false;
          // 调定时器，倒计时
          countDown(60);
        })
        .catch(error => {
          console.log(error);
        });
    };

    /**
     * 提交表单sxvhnr  a3sq0p
     */
    const submitForm = formName => {
      refs[formName].validate(valid => {
        if (valid) {
          if (model.value == "login") {
            login();
          } else if (model.value == "register") {
            register();
          }
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    };

    /**
     * 登陆
     */
    const login = () => {
      loginButtonStatus.value = true;
      let loginData = {
        username: loginForm.username,
        // password: sha1(loginForm.password),
        password: loginForm.password,
        code: loginForm.code,
        module: model.value
      };
      Login(loginData)
        .then(response => {
          // 路由跳转
          root.$message.success(response.data.message);
        })
        .catch(error => {
          root.$message.error(response.data.message);
          loginButtonStatus.value = false;
        });
    };

    /**
     * 注册
     */
    const register = () => {
      let requestData = {
        username: loginForm.username,
        // password: sha1(loginForm.password),
        password: loginForm.password,
        code: loginForm.code,
        module: model.value
      };
      Register(requestData)
        .then(response => {
          toggleMenu(menuTab[0]);
          clearCountDown();
        })
        .catch(error => {});
    };

    /**
     * 倒计时
     */
    const countDown = number => {
      // 判断定时器是否存在，存在则清楚
      if (timer.value) clearInterval(timer.value);
      let time = number;

      timer.value = setInterval(() => {
        time--;
        if (time <= 0) {
          clearInterval(timer.value);
          updataButtonStatus({
            status: false,
            text: "再次获取"
          });
        } else {
          codeButtonStatus.text = `倒计时${time}秒`;
        }
      }, 1000);
    };

    /**
     * 清楚倒计时
     */
    const clearountDown = () => {
      // 还原验证码按键默认状态
      codeButtonStatus.status = false;
      codeButtonStatus.text = "获取验证码";
      // 清处倒计时
      clearInterval(timer.value);
    };

    onMounted(() => {
      console.log(sha1("1234567890"));
    });

    return {
      menuTab,
      model,
      toggleMenu,
      submitForm,
      loginForm,
      rules,
      getSms,
      loginButtonStatus,
      codeButtonStatus
    };
    // 08ghax
  }
};
</script>

<style lang="scss">
#login {
  height: 100vh;
  background: #344a5f;
  // background: $bg;
}
.login-wrap {
  margin: auto;
  width: 330px;
}
.menu-tab {
  text-align: center;
  li {
    display: inline-block;
    width: 88px;
    line-height: 36px;
    font-size: 14px;
    color: #fff;
    border-radius: 2px;
    cursor: pointer;
  }
  .current {
    background: rgba(0, 0, 0, 0.1);
  }
}
.login-form {
  margin-top: 29px;
  label {
    display: block;
    margin-bottom: 3px;
    font-size: 14px;
    color: #fff;
  }
  .item-from {
    margin-bottom: 13px;
  }
  .block {
    display: block;
    width: 100%;
  }
  .login-btn {
    margin-top: 19px;
  }
}
</style>
