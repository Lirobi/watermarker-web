// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useRouter() {
        return {
            push: jest.fn(),
            replace: jest.fn(),
            prefetch: jest.fn(),
            back: jest.fn(),
            forward: jest.fn(),
            refresh: jest.fn(),
        };
    },
    useSearchParams() {
        return {
            get: jest.fn(),
        };
    },
    usePathname() {
        return '';
    },
}));

// Mock next-auth
jest.mock('next-auth', () => {
    const originalModule = jest.requireActual('next-auth');
    return {
        __esModule: true,
        ...originalModule,
        default: jest.fn(() => ({
            GET: jest.fn(),
            POST: jest.fn()
        })),
    };
});

// Mock next-auth/react
jest.mock('next-auth/react', () => {
    const originalModule = jest.requireActual('next-auth/react');
    return {
        __esModule: true,
        ...originalModule,
        signIn: jest.fn(),
        signOut: jest.fn(),
        useSession: jest.fn(() => {
            return { data: null, status: 'unauthenticated' };
        }),
    };
});

// Mock framer-motion
jest.mock('framer-motion', () => {
    const actual = jest.requireActual('framer-motion');
    return {
        __esModule: true,
        ...actual,
        motion: {
            div: ({ children, ...props }) => <div data-testid="motion-div" {...props}>{children}</div>,
            button: ({ children, ...props }) => <button data-testid="motion-button" {...props}>{children}</button>,
        },
        AnimatePresence: ({ children }) => <>{children}</>,
    };
});

// Mock next/image
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props) => {
        return <img {...props} data-testid="next-image" />;
    },
}));

// Mock SVG
global.SVGElement = function () { };

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    takeRecords() { return []; }
    unobserve() { }
};

// Mock Request and Response for Next.js API routes
global.Request = class Request {
    constructor(input, init) {
        this.url = input;
        this.method = init?.method || 'GET';
        this.headers = new Headers(init?.headers || {});
        this.body = init?.body || null;
    }
};

global.Response = class Response {
    constructor(body, init) {
        this.body = body;
        this.status = init?.status || 200;
        this.statusText = init?.statusText || '';
        this.headers = new Headers(init?.headers || {});
    }

    json() {
        return Promise.resolve(JSON.parse(this.body));
    }
};

// Mock @auth/prisma-adapter
jest.mock('@auth/prisma-adapter', () => ({
    PrismaAdapter: jest.fn(() => ({
        createUser: jest.fn(),
        getUser: jest.fn(),
        getUserByEmail: jest.fn(),
        getUserByAccount: jest.fn(),
        updateUser: jest.fn(),
        deleteUser: jest.fn(),
        linkAccount: jest.fn(),
        unlinkAccount: jest.fn(),
        createSession: jest.fn(),
        getSessionAndUser: jest.fn(),
        updateSession: jest.fn(),
        deleteSession: jest.fn(),
        createVerificationToken: jest.fn(),
        useVerificationToken: jest.fn(),
    })),
})); 