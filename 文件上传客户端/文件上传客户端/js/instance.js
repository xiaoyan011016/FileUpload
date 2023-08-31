let instance = axios.create({
  baseURL: "http://127.0.0.1:8888",
  headers: { "Content-Type": "multipart/form-data" },
  timeout: 300000,
  transformRequest: (data, headers) => {
    // data就是请求主体数据
    // headers就是设置的请求头Content-Type
    if (headers["Content-Type"] === "application/x-www-form-urlencoded") {
      //   是该请求头就将请求主体的对象格式转换为url格式
      return Qs.stringify(data);
    }
    // 否则不进行处理
    return data;
  },
});
instance.interceptors.response.use(
  function (response) {
    // 2xx 范围内的状态码都会触发该函数。
    // 对响应数据做点什么
    return response.data;
  },
  function (error) {
    // 超出 2xx 范围的状态码都会触发该函数。
    // 对响应错误做点什么
    return Promise.reject(error);
  }
);

// // axios.defaults.baseURL = "http://127.0.0.1:8888";
// // // 默认传输文件的请求头
// // axios.defaults.headers["Content-Type"] = "multipart/form-data";
// // // `transformRequest` 允许在向服务器发送前，修改请求数据
// // axios.defaults.transformRequest = (data, headers) => {
// //   // data就是请求主体数据
// //   // headers就是设置的请求头Content-Type
// //   if (headers["Content-Type"] === "application/x-www-form-urlencoded") {
// //     //   是该请求头就将请求主体的对象格式转换为url格式
// //     return Qs.stringify(data);
// //   }
// //   // 否则不进行处理
// //   return data;
// // };

// let instance = axios.create();
// instance.defaults.baseURL = "http://127.0.0.1:8888";
// instance.defaults.headers["Content-Type"] = "multipart/form-data";
// instance.defaults.transformRequest = (data, headers) => {
//   const contentType = headers["Content-Type"];
//   if (contentType === "application/x-www-form-urlencoded")
//     return Qs.stringify(data);
//   return data;
// };
// instance.interceptors.response.use((response) => {
//   return response.data;
// });
