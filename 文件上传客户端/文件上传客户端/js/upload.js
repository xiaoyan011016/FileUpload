// FormData文件上传
(function () {
  let upload1 = document.querySelector("#upload1"),
    upload_inp = upload1.querySelector(".upload_inp"),
    upload_inp_select = upload1.querySelector(".upload_button.select"),
    upload_inp_upload = upload1.querySelector(".upload_button.upload"),
    upload_tip = upload1.querySelector(".upload_tip"),
    upload_list = upload1.querySelector(".upload_list");
  let _file = null;
  // 给选择文件按钮绑定时间事件
  upload_inp_select.addEventListener("click", () => {
    // 判断是否有disable或loading属性有就不继续往下走。类似节流防抖
    if (
      upload_inp_select.classList.contains("disable") ||
      upload_inp_upload.classList.contains("loading")
    ) {
      return;
    }

    //   触发自带的点击方法选取文件
    upload_inp.click();
  });

  upload_inp.addEventListener("change", () => {
    //   文件选取需要基于change事件完成
    let file = upload_inp.files[0];
    _file = file;
    if (!/(png|jpe?g)/i.test(file.type)) {
      alert("请选择png或者jpg或者jpeg格式的图片");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("图片大小不能超过2M");
      return;
    }
    upload_tip.style.display = "none";
    upload_list.style.display = "block";
    upload_list.innerHTML = `
        <li>
            <span>文件：${file.name}</span>
            <span><em>移除</em></span>
        </li>
      `;
  });
  const clearHandle = () => {
    // 移除文件了删除公共状态中保存的file对象
    _file = null;
    // 显示提示
    upload_tip.style.display = "block";
    // 删除文件列表显示
    upload_list.style.display = "none";
    upload_list.innerHTML = ``;
  };
  upload_list.addEventListener("click", (e) => {
    //   点击的是文件的删除按钮
    if (e.target.tagName === "EM") {
      clearHandle();
    }
  });

  const handleStyle = (flag) => {
    // flag为真代表选择文件按钮需要添加disable样式，上传服务器按钮需要添加loading样式
    if (flag) {
      upload_inp_select.classList.add("disable");
      upload_inp_upload.classList.add("loading");
    } else {
      upload_inp_select.classList.remove("disable");
      upload_inp_upload.classList.remove("loading");
    }
  };
  // 文件上传按钮
  upload_inp_upload.addEventListener("click", async () => {
    // 判断是否有disable或loading属性有就不继续往下走。类似节流防抖
    if (
      upload_inp_select.classList.contains("disable") ||
      upload_inp_upload.classList.contains("loading")
    ) {
      return;
    }
    // 需要获取文件对象
    // 当没有选择文件的时候或者选择了文件又删除的情况下，不允许上传，_file=null
    if (!_file) {
      alert("请选择文件");
      return;
    }
    // 设置按钮样式
    handleStyle(true);
    let fm = new FormData();
    // 后端服务器需要字段file和filename
    fm.append("file", _file);
    fm.append("filename", _file.name);
    try {
      let { code, servicePath } = await instance.post("/upload_single", fm);
      if (+code === 0) {
        alert(`上传成功:文件服务器地址${servicePath}`);
        return;
      }
    } catch (error) {
      console.log(error);
      alert("请重新上传！");
    } finally {
      // 统一调用公共逻辑代码部分
      clearHandle();
      // 设置按钮样式
      handleStyle(false);
    }
  });
})();

// Base64文件上传
(function () {
  let upload2 = document.querySelector("#upload2"),
    upload_inp = upload2.querySelector(".upload_inp"),
    upload_inp_select = upload2.querySelector(".upload_button.select");
  let _file = null;

  const isGo = (ele) => {
    return (
      ele.classList.contains("disable") || ele.classList.contains("loading")
    );
  };
  // 给选择文件按钮绑定时间事件
  upload_inp_select.addEventListener("click", function () {
    // 判断是否有disable或loading属性有就不继续往下走。类似节流防抖
    if (isGo(this)) return;
    //   触发自带的点击方法选取文件
    upload_inp.click();
  });

  const changeBase64 = (file) => {
    return new Promise((resolve) => {
      let reader = new FileReader();
      reader.readAsDataURL(file); //异步操作
      reader.onload = (res) => {
        //需要基于load事件获取异步操作的结果
        resolve(res.target.result);
      };
    });
  };
  upload_inp.addEventListener("change", async () => {
    //   文件选取需要基于change事件完成
    let file = upload_inp.files[0];
    _file = file;
    if (!/(png|jpe?g)/i.test(file.type)) {
      alert("请选择png或者jpg或者jpeg格式的图片");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert("图片大小不能超过2M");
      return;
    }
    // 设置按钮样式
    upload_inp_select.classList.add("loading");
    let base64 = await changeBase64(file);
    try {
      let { code, servicePath, codeText } = await instance.post(
        "/upload_single_base64",
        {
          //将特殊字符进行编码，主要服务端进行了解码处理，因此这里需要进行处理
          file: encodeURIComponent(base64),
          filename: _file.name,
        },
        {
          // 服务器对base64的Content-Type类型进行了限制,需要是urlencodede
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      if (+code === 0) {
        alert(`上传成功：${servicePath}`);
        return;
      }
      throw codeText;
    } catch (error) {
      console.log(error);
      alert("请重新上传!");
    } finally {
      // 移除样式类
      upload_inp_select.classList.remove("loading");
    }
  });
})();
