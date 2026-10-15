declare module '@lhncbc/ucum-lhc' {
  export interface ConvertResult {
    status: 'succeeded' | 'failed' | 'error';
    toVal: number | null;
    msg: string[];
    code?: string;
  }
  export interface ValidateResult {
    status: 'valid' | 'invalid' | 'error';
    ucumCode: string | null;
    msg: string[];
  }
  export interface UcumLhcUtilsInstance {
    convertUnitTo(
      fromUnitCode: string,
      fromVal: number,
      toUnitCode: string,
      options?: { molecularWeight?: number; suggest?: boolean },
    ): ConvertResult;
    validateUnitString(code: string): ValidateResult;
  }
  const pkg: { UcumLhcUtils: { getInstance(): UcumLhcUtilsInstance } };
  export default pkg;
}
