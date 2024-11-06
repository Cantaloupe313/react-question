import axios, { AxiosRequestConfig, AxiosInstance, AxiosResponse } from "axios";
import TokenManager from "../tokenManager";
import DefaultErrorHandler from "../errorHandler";
// 定义错误处理的接口
interface ErrorHandler {
  (error: any): void;
}

export type Response<T> =
  | {
      data: T;
      success: true;
      errorCode?: string;
      errorMessage?: string;
    }
  | {
      data?: T;
      success: false;
      errorCode: number;
      errorMessage: string;
    };

type ExtractKeys<T extends string> =
  T extends `${string}{${infer Key}}${infer Rest}`
    ? Key | ExtractKeys<Rest>
    : never;

type PathVariables<T extends string> = ExtractKeys<T> extends never
  ? Record<string, string | number>
  : Record<ExtractKeys<T>, string | number>;

type RequestConfig<
  D extends object,
  Q extends object,
  U extends string,
  P = PathVariables<U>
> = Omit<AxiosRequestConfig<D>, "url" | "params"> & {
  /**
   * @example '/api/:id' => pathVariables: { id: "1" }
   * @example '/api/:id/:name' => pathVariables: { id: "1", name: "2" }
   */
  url: U;
  ignoreAuth?: boolean; //不為true時 header需附帶Authentication value為token
  silentError?: boolean;
  throwError?: boolean;
  params?: Q;
  /**
   * @example '/api/:id' => { id: "1" }
   * @example '/api/:id/:name' => { id: "1", name: "2" }
   */
  pathVariables?: P;
};

export interface Request {
  <
    T,
    D extends object = any,
    Q extends object = any,
    U extends string = string,
    P = PathVariables<U>
  >(
    args: RequestConfig<D, Q, U, P>
  ): Promise<Response<T>>;
}
// 默认的错误处理函数
const defaultErrorHandler: ErrorHandler = (error) => {
  // 假设toast实例
  const Toast = { show: () => {} };
  new DefaultErrorHandler(Toast).handle(error);
  // 这里可以弹出 toast 或者其他 UI 框架的提示
  console.error("Request failed:", error);
};

// 创建 axios 实例
const instance: AxiosInstance = axios.create({
  baseURL: "/api", // 根据实际情况修改
});

// 请求拦截器
instance.interceptors.request.use(
  (config: any) => {
    // 处理 token 的逻辑
    if (!config?.ignoreAuth) {
      const token = TokenManager.getToken();
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  async (response) => {
    // 处理 token 过期的情况
    if (response.data.status === 401) {
      try {
        const newToken = await TokenManager.refreshToken();
        if (newToken) {
          response.config.headers["Authorization"] = `Bearer ${newToken}`;
          return instance.request(response.config);
        }
      } catch (refreshError) {
        TokenManager.removeToken();
        // 路由重定向到登录页面
        location.href = `${location.origin}/login`;
        return Promise.reject(refreshError);
      }
    }
    return response;
  },
  async (error) => {
    // 处理响应错误
    if (error.config.silentError) {
      defaultErrorHandler(error);
    }
    if (error.config.throwError) {
      return Promise.reject(error);
    }

    return Promise.resolve(error.response);
  }
);
const request: Request = async <
  T = any,
  D extends object = any,
  Q extends object = any,
  U extends string = string,
  P = PathVariables<U>
>(
  args: RequestConfig<D, Q, U, P>
) => {
  try {
    const response: AxiosResponse<T> = await instance.request({
      ...args,
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default request;
