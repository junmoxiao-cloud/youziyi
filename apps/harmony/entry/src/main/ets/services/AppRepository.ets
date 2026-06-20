import http from '@ohos.net.http';
import {
  ApiMode,
  APP_CONFIG,
  getVerificationRequestMode,
  isMockFallbackEnabled,
  isMockMode,
  isUniversalCodeEnabled,
  resolveApiUrl
} from '../common/AppConfig';
import {
  ApiResponse,
  AuthResult,
  CareProfileDraft,
  CheckInPayload,
  CheckInResult,
  FamilyCreateResult,
  FamilyJoinResult,
  TodayCheckInStatusResponse,
  UserProfileResponse,
  UserProfileUpdatePayload,
  UserRole,
  VerificationResult,
  WarningStatusData,
  WeatherData
} from '../common/ApiModels';
import { MockApi } from '../mock/MockApi';

interface ServerHealthData {
  status: string
  timestamp: number
}

function parseApiResponse<T>(rawResult: string): ApiResponse<T> {
  return JSON.parse(rawResult) as ApiResponse<T>
}

function requestRemote<T>(
  path: string,
  method: http.RequestMethod,
  payload?: Object
): Promise<ApiResponse<T>> {
  const httpRequest = http.createHttp()
  const requestUrl = resolveApiUrl(path)
  const options: http.HttpRequestOptions = {
    method: method,
    expectDataType: http.HttpDataType.STRING,
    connectTimeout: 10000,
    readTimeout: 10000,
    header: {
      'Content-Type': 'application/json'
    }
  }

  if (payload !== undefined) {
    options.extraData = JSON.stringify(payload)
  }

  return new Promise((resolve, reject) => {
    httpRequest.request(requestUrl, options, (error, data) => {
      httpRequest.destroy()

      if (error) {
        reject(new Error(`远程请求失败: ${requestUrl}`))
        return
      }

      if (data.responseCode < 200 || data.responseCode >= 300) {
        reject(new Error(`远程请求状态异常(${data.responseCode}): ${requestUrl}`))
        return
      }

      try {
        resolve(parseApiResponse<T>(data.result as string))
      } catch (parseError) {
        reject(new Error(`远程响应解析失败: ${requestUrl}`))
      }
    })
  })
}

function buildRemoteVerificationHint(phone: string): string {
  const universalCodeHint = isUniversalCodeEnabled()
    ? `当前仍保留万能验证码 ${APP_CONFIG.verification.universalCode} 作为演示兜底。`
    : '当前已关闭万能验证码兜底，请使用正式短信验证码能力。'

  return [
    `已绑定现有服务端 ${resolveApiUrl(APP_CONFIG.verification.remoteBindingPath)}。`,
    `当前手机号：${phone || '未填写'}。`,
    '服务端尚未提供正式短信验证码接口，因此登录页仅做边界校验。',
    universalCodeHint
  ].join('')
}

export class AppRepository {
  requestVerificationCode(phone: string): Promise<ApiResponse<VerificationResult>> {
    if (isMockMode(getVerificationRequestMode())) {
      return MockApi.requestVerificationCode(phone);
    }

    return requestRemote<ServerHealthData>(
      APP_CONFIG.verification.remoteBindingPath,
      http.RequestMethod.GET
    )
      .then(() => {
        const verificationResult: VerificationResult = {
          codeHint: buildRemoteVerificationHint(phone),
          canBypass: isUniversalCodeEnabled()
        }

        const response: ApiResponse<VerificationResult> = {
          code: 0,
          data: verificationResult,
          message: '已连接现有服务端，验证码沿用演示壳策略'
        }

        return response
      })
      .catch((error: Error) => {
        if (!isMockFallbackEnabled()) {
          return Promise.reject(new Error(`正式环境或当前配置已禁用 Mock 回退，请检查 ${resolveApiUrl(APP_CONFIG.verification.remoteBindingPath)} 的可用性。`))
        }

        return MockApi.requestVerificationCode(phone).then((response) => {
          const mergedResult: VerificationResult = {
            codeHint: `${response.data.codeHint}；远程绑定地址 ${resolveApiUrl(APP_CONFIG.verification.remoteBindingPath)} 当前不可达。`,
            canBypass: response.data.canBypass
          }

          const mergedResponse: ApiResponse<VerificationResult> = {
            code: response.code,
            data: mergedResult,
            message: `远程轨道不可用，已回退到 Mock：${response.message}`
          }

          return mergedResponse
        })
      })
  }

  register(name: string, password: string, role: UserRole, cityCode?: string): Promise<ApiResponse<AuthResult>> {
    if (isMockMode(APP_CONFIG.apiMode)) {
      return MockApi.register(name, password, role, cityCode)
    }

    return requestRemote<AuthResult>('/api/auth/register', http.RequestMethod.POST, {
      name,
      password,
      role,
      cityCode
    })
  }

  login(name: string, password: string): Promise<ApiResponse<AuthResult>> {
    if (isMockMode(APP_CONFIG.apiMode)) {
      return MockApi.login(name, password)
    }

    return requestRemote<AuthResult>('/api/auth/login', http.RequestMethod.POST, {
      name,
      password
    })
  }

  getUserProfile(userId: string): Promise<ApiResponse<UserProfileResponse>> {
    if (isMockMode(APP_CONFIG.apiMode)) {
      return MockApi.getUserProfile(userId)
    }

    return requestRemote<UserProfileResponse>(`/api/user/profile/${userId}`, http.RequestMethod.GET)
  }

  updateUserProfile(payload: UserProfileUpdatePayload): Promise<ApiResponse<UserProfileResponse>> {
    if (isMockMode(APP_CONFIG.apiMode)) {
      return MockApi.updateUserProfile(payload)
    }

    return requestRemote<UserProfileResponse>('/api/user/profile/update', http.RequestMethod.POST, payload)
  }

  submitCheckIn(payload: CheckInPayload): Promise<ApiResponse<CheckInResult>> {
    if (isMockMode(APP_CONFIG.apiMode)) {
      return MockApi.submitCheckIn(payload);
    }

    return requestRemote<CheckInResult>('/api/health/checkin', http.RequestMethod.POST, payload)
  }

  getTodayCheckInStatus(userId: string): Promise<ApiResponse<TodayCheckInStatusResponse>> {
    if (isMockMode(APP_CONFIG.apiMode)) {
      return MockApi.getTodayCheckInStatus(userId)
    }

    return requestRemote<TodayCheckInStatusResponse>(`/api/health/checkin-status/${userId}`, http.RequestMethod.GET)
  }

  getWarningStatus(userId: string): Promise<ApiResponse<WarningStatusData>> {
    if (isMockMode(APP_CONFIG.apiMode)) {
      return MockApi.getWarningStatus(userId);
    }

    return requestRemote<WarningStatusData>(`/api/warning/status/${userId}`, http.RequestMethod.GET)
  }

  getWeather(cityCode: string): Promise<ApiResponse<WeatherData>> {
    if (isMockMode(APP_CONFIG.apiMode)) {
      return MockApi.getWeather(cityCode);
    }

    return requestRemote<WeatherData>(`/api/weather/current?cityCode=${cityCode}`, http.RequestMethod.GET)
  }

  createFamily(userId: string, familyName?: string): Promise<ApiResponse<FamilyCreateResult>> {
    if (isMockMode(APP_CONFIG.apiMode)) {
      return MockApi.createFamily(userId, familyName)
    }

    return requestRemote<FamilyCreateResult>('/api/family/create', http.RequestMethod.POST, {
      userId,
      familyName
    })
  }

  joinFamily(userId: string, inviteCode: string): Promise<ApiResponse<FamilyJoinResult>> {
    if (isMockMode(APP_CONFIG.apiMode)) {
      return MockApi.joinFamily(userId, inviteCode)
    }

    return requestRemote<FamilyJoinResult>('/api/family/join', http.RequestMethod.POST, {
      userId,
      inviteCode
    })
  }

  saveCareProfile(profile: CareProfileDraft): Promise<ApiResponse<CareProfileDraft>> {
    if (isMockMode(APP_CONFIG.apiMode)) {
      return MockApi.saveCareProfile(profile);
    }

    const response: ApiResponse<CareProfileDraft> = {
      code: 0,
      data: profile,
      message: `当前资料页仍为本地暂存，远程基座已绑定 ${APP_CONFIG.apiBaseUrl}`
    }

    return Promise.resolve(response)
  }
}

export const appRepository: AppRepository = new AppRepository();
