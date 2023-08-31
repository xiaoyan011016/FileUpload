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

// 缩略图&客户端生成hash名
(function () {
  let upload3 = document.querySelector("#upload3"),
    upload_inp = upload3.querySelector(".upload_inp"),
    upload_inp_select = upload3.querySelector(".upload_button.select"),
    upload_inp_upload = upload3.querySelector(".upload_button.upload"),
    upload_abbre = upload3.querySelector(".upload_abbre"),
    upload_abbre_img = upload_abbre.querySelector("img");
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
    // 设置按钮样式
    upload_inp_select.classList.add("disable");
    let base64 = await changeBase64(file); //图片本地预览采用base64格式
    upload_abbre.style.display = "block";
    upload_abbre_img.src = base64;
    upload_inp_select.classList.remove("disable");
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
  // 处理hash名字
  const changeBuffer = (file) => {
    return new Promise((resolve) => {
      let reader = new FileReader();
      reader.readAsArrayBuffer(file); //异步操作
      reader.onload = (res) => {
        //需要基于load事件获取异步操作的结果
        let buffer = res.target.result;
        let spark = new SparkMD5.ArrayBuffer(); //创建md5对象，用于生成hash值
        spark.append(buffer);
        let hash = spark.end(); //自动根据文件二进制内容生成名字
        let suffix = /\.[a-zA-Z0-9]+/.exec(file.name)[0]; // +代表一个或多个，文件的后缀必须存在
        resolve({
          buffer,
          hash,
          suffix,
          filename: `${hash}${suffix}`, //手动拼接文件和后缀
        });
      };
    });
  };
  // 文件上传按钮
  upload_inp_upload.addEventListener("click", async () => {
    // 判断是否有disable或loading属性有就不继续往下走。类似节流防抖
    if (isGo(upload_inp_upload)) return;
    // 需要获取文件对象
    // 当没有选择文件的时候或者选择了文件又删除的情况下，不允许上传，_file=null
    if (!_file) {
      alert("请选择文件");
      return;
    }

    let { filename } = await changeBuffer(_file);
    // 设置按钮样式
    handleStyle(true);
    let fm = new FormData();
    console.log(_file);
    // 后端服务器需要字段file和filename
    fm.append("file", _file);
    fm.append("filename", filename);
    try {
      let { code, servicePath } = await instance.post(
        "/upload_single_name",
        fm
      );
      if (+code === 0) {
        alert(`上传成功:文件服务器地址${servicePath}`);
        return;
      }
    } catch (error) {
      console.log(error);
      alert("请重新上传！");
    } finally {
      // 设置按钮样式
      handleStyle(false);
      upload_abbre.style.display = "none";
      upload_abbre_img.src = "";
      _file = null;
    }
  });
})();

// 进度条管控
(function () {
  let upload4 = document.querySelector("#upload4"),
    upload_inp = upload4.querySelector(".upload_inp"),
    upload_inp_select = upload4.querySelector(".upload_button.select"),
    upload_progress = upload4.querySelector(".upload_progress"),
    upload_progress_value = upload_progress.querySelector(".value");
  let _file = null;
  const delay = (time) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    });
  };
  const isGo = (ele) => {
    return (
      ele.classList.contains("disable") || ele.classList.contains("loading")
    );
  };
  // 给选择文件按钮绑定时间事件
  upload_inp_select.addEventListener("click", async function () {
    // 判断是否有disable或loading属性有就不继续往下走。类似节流防抖
    if (isGo(this)) return;
    //   触发自带的点击方法选取文件
    upload_inp.click();
  });

  upload_inp.addEventListener("change", async (event) => {
    event.preventDefault();
    //   文件选取需要基于change事件完成
    let file = upload_inp.files[0];
    _file = file;
    // 设置按钮样式
    upload_inp_select.classList.add("loading");
    try {
      let fm = new FormData();
      fm.append("file", _file);
      fm.append("filename", _file.name);
      let { code, codeText, servicePath } = await instance.post(
        "/upload_single",
        fm,
        {
          onUploadProgress: (e) => {
            let { total, loaded } = e; //当前进度总数和进度现有位置
            upload_progress.style.display = "block"; //开启显示容器
            upload_progress_value.style.width = `${(loaded / total) * 100}%`;
          },
        }
      );
      if (+code === 0) {
        upload_progress_value.style.width = `100%`; //成功直接显示100%
        await delay(300);
        alert(`上传成功:文件服务器地址${servicePath}`);
        return;
      }
      throw codeText;
    } catch (error) {
      console.log(error);
    } finally {
      upload_inp_select.classList.remove("loading");
      upload_progress.style.display = "none";
      upload_progress_value.style.width = 0;
    }
  });
})();

// 多文件上传
(function () {
  let upload = document.querySelector("#upload5"),
    upload_inp = upload.querySelector(".upload_inp"),
    upload_inp_select = upload.querySelector(".upload_button.select"),
    upload_inp_upload = upload.querySelector(".upload_button.upload"),
    upload_list = upload.querySelector(".upload_list");
  let _files = [];

  const isGo = (ele) => {
    return (
      ele.classList.contains("disable") || ele.classList.contains("loading")
    );
  };
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
  // 给选择文件按钮绑定时间事件
  upload_inp_select.addEventListener("click", function () {
    // 判断是否有disable或loading属性有就不继续往下走。类似节流防抖
    if (isGo(this)) return;
    //   触发自带的点击方法选取文件
    upload_inp.click();
  });

  // 生成唯一id函数，利用时间戳+随机数
  const createRandom = () => {
    let key = Date.now() * Math.random(); //因为每次的数都足够大都会带小数点不用后面进行判断
    return String(key.toString(16)).replace(".", ""); // 转换为16进制后从数字转换为字符串,然后将点去除
  };

  upload_inp.addEventListener("change", async () => {
    //   文件选取需要基于change事件完成
    _files = Array.from(upload_inp.files); //FileList 类数组
    // 重构数组，并设置唯一标识
    _files = _files.map((file, index) => {
      return {
        file,
        filename: file.name,
        key: createRandom(),
      };
    });
    //  显示已选文件
    let str = "";
    _files.forEach((item, index) => {
      str += `
          <li key='${item.key}'>
            <span>文件：${item.filename}</span>
            <span><em>移除</em></span>
          </li>
      `;
    });
    // 插入页面
    upload_list.style.display = "block";
    upload_list.innerHTML = str;
  });
  // 删除按钮的逻辑
  upload_list.addEventListener("click", (e) => {
    let target = e.target;
    let curLi = null;
    if (target.tagName === "EM") {
      // 从结构中删除该元素的整体内容（删除li节点及其子节点）
      let curLi = target.parentNode.parentNode;
      if (!curLi) return; //不存在直接退出，防止出错
      upload_list.removeChild(curLi);
      // 删除数据
      let key = curLi.getAttribute("key"); //通过自定义属性获取唯一标识
      _files = _files.filter((file) => {
        return key !== file.key;
      });
      if (_files.length === 0) {
        upload_list.style.display = "none";
        upload_list.innerHTML = "";
      }
    }
  });

  // 服务器上传按钮
  upload_inp_upload.addEventListener("click", () => {
    if (isGo(upload_inp_upload)) return;
    if (_files.length === 0) {
      alert("请先选择文件");
      return;
    }
    handleStyle(true);
    // 获取所有的li元素
    let upload_list_arr = Array.from(upload_list.querySelectorAll("li"));
    // 这里有多个请求需要发送
    _files = _files.map((item) => {
      let fm = new FormData();
      fm.append("file", item.file);
      fm.append("filename", item.filename);
      // 进行当前li元素匹配,返回li元素
      let curli = upload_list_arr.find((li) => {
        return li.getAttribute("key") === item.key;
      });
      // 获取该li元素下的最后一个span元素
      let curspan = curli?.querySelector("span:last-child");
      return instance
        .post("/upload_single", fm, {
          // 给每一个文件设置进度条样式
          onUploadProgress(ev) {
            /*  这里设计让li元素的最后一个span元素中的内容变为进度百分比显示即可，因此在这里需要获取对于元素
              只需要获取到当前的li元素即可，因为li元素身上绑定了唯一标识，因此可以获取所有的li元素和当map中item.key进行匹配
              <li key='xx'>
                    <span>文件：xxxxx</span>
                    <span>进度显示：10%</span>
              </li> 
          */
            if (curspan) {
              curspan.innerHTML = `进度显示:${(
                (ev.loaded / ev.total) *
                100
              ).toFixed(2)}%`;
            }
          },
        })
        .then((res) => {
          if (+res.code === 0) {
            if (curspan) {
              curspan.innerHTML = `进度显示:100%`;
              console.log("上传成功");
              return;
            }
          }
          Promise.reject(res.codeText);
        });
    });
    Promise.all(_files) //只要有一个请求失败了整体失败
      .then((res) => {
        alert("上传成功");
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        handleStyle(false);
        _files = [];
        upload_list.style.display = "none";
        upload_list.innerHTML = "";
      });
  });
})();

// 拖拽上传
(function () {
  let upload = document.querySelector("#upload6"),
    upload_inp = upload.querySelector(".upload_inp"),
    upload_submit = upload.querySelector(".upload_submit"),
    upload_mark = upload.querySelector(".upload_mark");

  let _file = null;
  let isRun = false; //节流防抖标志,true代表节流防抖，代表正在运行

  const isGo = (ele) => {
    return (
      ele.classList.contains("disable") || ele.classList.contains("loading")
    );
  };

  // 上传文件方法
  const uploadFile = async (file) => {
    if (isRun) return;
    isRun = true;
    // 将遮罩层启动
    upload_mark.style.display = "block";
    try {
      let fm = new FormData();
      fm.append("file", file);
      fm.append("filename", file.name);
      let { code, codeText, servicePath } = await instance.post(
        "/upload_single",
        fm
      );
      if (+code === 0) {
        alert(`上传成功:文件服务器地址${servicePath}`);
        return;
      }
      throw codeText;
    } catch (error) {
      console.log(error);
    } finally {
      // 清除默认样式类
      upload_mark.style.display = "none";
      isRun = false;
    }
  };

  // 给选择文件按钮绑定时间事件
  upload_submit.addEventListener("click", async function () {
    // 判断是否有disable或loading属性有就不继续往下走。类似节流防抖
    if (isGo(this)) return;
    //   触发自带的点击方法选取文件
    upload_inp.click();
  });

  upload_inp.addEventListener("change", async () => {
    //   文件选取需要基于change事件完成
    _file = upload_inp.files[0];
    uploadFile(_file);
  });

  // 容器添加拖拽事件
  /*   upload.addEventListener("dragenter", (e) => {
    console.log("进入了");
  });
  upload.addEventListener("dragleave", (e) => {
    console.log("离开了");
  }); */
  upload.addEventListener("dragover", (e) => {
    e.preventDefault();
  });
  upload.addEventListener("drop", (e) => {
    e.preventDefault();
    let file = e.dataTransfer.files[0];
    uploadFile(file);
  });
})();
