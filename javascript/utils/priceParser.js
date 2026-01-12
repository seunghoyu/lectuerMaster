/**
 * 금액 파싱 유틸리티
 * 엑셀에서 복사한 강의코드-금액 매핑 데이터를 파싱합니다.
 */
export class PriceParser {
    /**
     * 강의코드-금액 매핑 텍스트를 파싱합니다.
     * @param {string} text - 파싱할 텍스트 (탭/공백 구분)
     * @param {Set<string>} validCodes - 유효한 강의코드 Set (검증용)
     * @returns {Object} 파싱 결과 { success: boolean, priceMap: Object, errors: Array }
     */
    static parsePriceMapping(text, validCodes = new Set()) {
        if (!text || !text.trim()) {
            return {
                success: false,
                priceMap: {},
                errors: ['입력된 데이터가 없습니다.']
            };
        }

        const lines = text.split(/\r?\n/);
        const priceMap = {};
        const errors = [];
        let successCount = 0;
        let failCount = 0;

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return; // 빈 줄 건너뛰기

            // 탭 또는 여러 공백으로 분리
            const parts = trimmedLine.split(/\t|\s{2,}/).filter(part => part.trim());

            if (parts.length < 2) {
                errors.push(`[${index + 1}행] 형식 오류: 강의코드와 금액이 모두 필요합니다. (${trimmedLine})`);
                failCount++;
                return;
            }

            const lectureCode = this.cleanLectureCode(parts[0]);
            const priceText = parts[1].trim();

            // 강의코드 검증
            if (!lectureCode || lectureCode.length === 0) {
                errors.push(`[${index + 1}행] 강의코드가 비어있습니다.`);
                failCount++;
                return;
            }

            if (validCodes.size > 0 && !validCodes.has(lectureCode)) {
                errors.push(`[${index + 1}행] 유효하지 않은 강의코드: ${lectureCode}`);
                failCount++;
                return;
            }

            // 금액 파싱
            const price = this.parsePrice(priceText);
            if (price === null) {
                errors.push(`[${index + 1}행] 금액 형식 오류: "${priceText}" (강의코드: ${lectureCode})`);
                failCount++;
                return;
            }

            if (price <= 0) {
                errors.push(`[${index + 1}행] 금액은 0보다 커야 합니다: ${price}원 (강의코드: ${lectureCode})`);
                failCount++;
                return;
            }

            // 중복 체크
            if (priceMap[lectureCode]) {
                errors.push(`[${index + 1}행] 중복된 강의코드: ${lectureCode} (기존 금액: ${priceMap[lectureCode]}원, 새 금액: ${price}원 - 새 금액으로 덮어씁니다)`);
                // 덮어쓰기
            }

            priceMap[lectureCode] = price;
            successCount++;
        });

        return {
            success: successCount > 0,
            priceMap,
            errors,
            stats: {
                total: lines.filter(line => line.trim()).length,
                success: successCount,
                fail: failCount
            }
        };
    }

    /**
     * 강의코드를 정리합니다 (공백, 따옴표 제거).
     * @param {string} code - 원본 강의코드
     * @returns {string} 정리된 강의코드
     */
    static cleanLectureCode(code) {
        if (!code) return '';
        return code.trim()
            .replace(/["']/g, '') // 큰따옴표, 작은따옴표 제거
            .replace(/\s+/g, ''); // 공백 제거
    }

    /**
     * 금액 텍스트를 숫자로 파싱합니다.
     * @param {string} priceText - 금액 텍스트 (예: "30,000", "30000", "30,000원")
     * @returns {number|null} 파싱된 금액 (실패 시 null)
     */
    static parsePrice(priceText) {
        if (!priceText) return null;

        // "원", 쉼표, 공백 제거
        let cleaned = priceText.trim()
            .replace(/원/g, '')
            .replace(/,/g, '')
            .replace(/\s+/g, '');

        // 숫자로 변환
        const price = parseInt(cleaned, 10);

        if (isNaN(price) || !isFinite(price)) {
            return null;
        }

        return price;
    }

    /**
     * 파싱 결과를 로그 형식으로 변환합니다.
     * @param {Object} parseResult - parsePriceMapping의 결과
     * @param {Array<string>} selectedCodes - 선택된 강의코드 배열
     * @returns {string} 로그 텍스트
     */
    static formatParseLog(parseResult, selectedCodes = []) {
        let log = `=== 금액 매핑 파싱 결과 ===\n\n`;
        
        const { stats, priceMap, errors } = parseResult;
        const selectedCodesSet = new Set(selectedCodes);

        log += `입력된 행 수: ${stats.total}개\n`;
        log += `성공: ${stats.success}개\n`;
        log += `실패: ${stats.fail}개\n\n`;

        if (errors.length > 0) {
            log += `[파싱 오류]\n`;
            errors.slice(0, 20).forEach(error => {
                log += `  ${error}\n`;
            });
            if (errors.length > 20) {
                log += `  ... 외 ${errors.length - 20}개 오류 더 있음\n`;
            }
            log += `\n`;
        }

        // 매핑된 강의코드 목록 (최대 50개)
        const mappedCodes = Object.keys(priceMap);
        if (mappedCodes.length > 0) {
            log += `[정상 매핑된 강의코드] (${mappedCodes.length}개)\n`;
            mappedCodes.slice(0, 50).forEach(code => {
                const price = priceMap[code];
                const isSelected = selectedCodesSet.has(code) ? '✓' : '✗';
                log += `  ${isSelected} ${code}: ${price.toLocaleString()}원\n`;
            });
            if (mappedCodes.length > 50) {
                log += `  ... 외 ${mappedCodes.length - 50}개 더 있음\n`;
            }
            log += `\n`;
        }

        // 선택되었지만 매핑되지 않은 강의코드
        const unmappedCodes = selectedCodes.filter(code => !priceMap[code]);
        if (unmappedCodes.length > 0) {
            log += `[매핑되지 않은 강의코드] (${unmappedCodes.length}개)\n`;
            unmappedCodes.slice(0, 30).forEach(code => {
                log += `  ✗ ${code}\n`;
            });
            if (unmappedCodes.length > 30) {
                log += `  ... 외 ${unmappedCodes.length - 30}개 더 있음\n`;
            }
            log += `\n`;
        }

        if (stats.success > 0 && unmappedCodes.length === 0) {
            log += `✅ 모든 선택된 강의코드가 성공적으로 매핑되었습니다!\n`;
        } else if (stats.success > 0) {
            log += `⚠️ 일부 강의코드가 매핑되지 않았습니다. 저장하려면 모든 강의코드를 매핑해야 합니다.\n`;
        } else {
            log += `❌ 매핑에 실패했습니다. 입력 형식을 확인해주세요.\n`;
        }

        return log;
    }
}
