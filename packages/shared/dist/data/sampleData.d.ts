import { User, Errand, Chat, Message } from '../types';
export declare const SEOUL_LOCATIONS: {
    gangnam: {
        coordinates: [number, number];
        address: string;
    };
    hongdae: {
        coordinates: [number, number];
        address: string;
    };
    myeongdong: {
        coordinates: [number, number];
        address: string;
    };
    itaewon: {
        coordinates: [number, number];
        address: string;
    };
    jongno: {
        coordinates: [number, number];
        address: string;
    };
    gangbuk: {
        coordinates: [number, number];
        address: string;
    };
    songpa: {
        coordinates: [number, number];
        address: string;
    };
    mapo: {
        coordinates: [number, number];
        address: string;
    };
    seocho: {
        coordinates: [number, number];
        address: string;
    };
    yeongdeungpo: {
        coordinates: [number, number];
        address: string;
    };
};
export declare const DONGTAN2_LOCATIONS: {
    central_park: {
        coordinates: [number, number];
        address: string;
    };
    dongtan_station: {
        coordinates: [number, number];
        address: string;
    };
    metapolis: {
        coordinates: [number, number];
        address: string;
    };
    lotte_mart: {
        coordinates: [number, number];
        address: string;
    };
    banseok_elementary: {
        coordinates: [number, number];
        address: string;
    };
    dongtan_lake_park: {
        coordinates: [number, number];
        address: string;
    };
    dongtan_complex: {
        coordinates: [number, number];
        address: string;
    };
    shindongtan_station: {
        coordinates: [number, number];
        address: string;
    };
    dongtan_hospital: {
        coordinates: [number, number];
        address: string;
    };
    dongtan_high_school: {
        coordinates: [number, number];
        address: string;
    };
};
export declare const ERRAND_CATEGORIES_KO: string[];
export declare const SAMPLE_USERS: User[];
export declare const SAMPLE_ERRANDS: Errand[];
export declare const SAMPLE_MESSAGES: Message[];
export declare const SAMPLE_CHATS: Chat[];
export declare const POPULAR_CATEGORIES_BY_LOCATION: {
    gangnam: string[];
    hongdae: string[];
    myeongdong: string[];
    itaewon: string[];
    jongno: string[];
};
export declare const REQUEST_PATTERNS: {
    morning: {
        categories: string[];
        peakHour: string;
    };
    afternoon: {
        categories: string[];
        peakHour: string;
    };
    evening: {
        categories: string[];
        peakHour: string;
    };
};
//# sourceMappingURL=sampleData.d.ts.map