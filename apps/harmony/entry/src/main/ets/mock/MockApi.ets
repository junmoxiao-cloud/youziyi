import {
  ApiResponse,
  CareProfileDraft,
  CheckInPayload,
  CheckInResult,
  VerificationResult,
  WarningStatusData,
  WeatherData
} from '../common/ApiModels';
import { APP_CONFIG, isUniversalCodeEnabled } from '../common/AppConfig';

function ok<T>(data: T, message: string): Promise<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    code: 0,
    data: data,
    message: message
  }
  return Promise.resolve(response)
}

export class MockApi {
  static requestVerificationCode(phone: string): Promise<ApiResponse<VerificationResult>> {
    const universalCode = APP_CONFIG.verification.universalCode
    const codeHint = isUniversalCodeEnabled()
      ? `当前走 Mock 验证码轨道，演示验证码固定为 ${universalCode}，手机号 ${phone || '未填写'}`
      : `当前走 Mock 验证码轨道，但正式环境已禁用万能验证码，手机号 ${phone || '未填写'}`

    const result: VerificationResult = {
      codeHint: codeHint,
      canBypass: isUniversalCodeEnabled()
    }

    return ok(result, '开发验证码已准备');
  }

  static submitCheckIn(payload: CheckInPayload): Promise<ApiResponse<CheckInResult>> {
    const result: CheckInResult = {
      recordId: `mock-${payload.userId}-${payload.timestamp}`,
      createdAt: payload.timestamp
    }

    return ok(result, '打卡成功');
  }

  static getWarningStatus(userId: string): Promise<ApiResponse<WarningStatusData>> {
    const result: WarningStatusData = {
      lastInteractionTime: Date.now() - 2 * 60 * 60 * 1000,
      warningLevel: 0,
      isTriggered: false
    }

    return ok(result, `${userId} 的预警状态已加载`);
  }

  static getWeather(cityCode: string): Promise<ApiResponse<WeatherData>> {
    const result: WeatherData = {
      cityCode: cityCode,
      weatherType: 'sunny',
      temperature: 27,
      humidity: 58
    }

    return ok(result, '天气数据已加载');
  }

  static saveCareProfile(profile: CareProfileDraft): Promise<ApiResponse<CareProfileDraft>> {
    return ok(profile, '关怀资料已暂存');
  }
}
