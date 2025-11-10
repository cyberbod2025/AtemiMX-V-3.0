import React from 'react';

// A generic Icon wrapper to reduce boilerplate
const Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
        {props.children}
    </svg>
);

export const Bars3Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path fillRule="evenodd" d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /></Icon>
);

export const BellIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path fillRule="evenodd" d="M12 2.25c-2.429 0-4.5 1.755-4.5 4.5v.255c-.95.24-1.809.59-2.618 1.052A9.738 9.738 0 002.25 12c0 2.868 1.22 5.457 3.22 7.282.995.922 2.203 1.543 3.53 1.874A.75.75 0 0010.5 21v-1.556c1.17.22 2.339.22 3.509 0V21a.75.75 0 001.5 0v-1.398a6.836 6.836 0 003.53-1.874C20.53 17.457 21.75 14.868 21.75 12a9.738 9.738 0 00-2.632-6.443 13.682 13.682 0 00-2.618-1.052V6.75c0-2.745-2.071-4.5-4.5-4.5zM15 6.75v.255a8.25 8.25 0 00-6 0V6.75c0-1.5.75-3 3-3s3 1.5 3 3zM12 10.5a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clipRule="evenodd" /></Icon>
);

export const HomeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" /><path d="M12 5.432l8.159 8.159c.026.026.05.054.07.084v6.175a2.25 2.25 0 01-2.25 2.25H6.a2.25 2.25 0 01-2.25-2.25v-6.175a.973.973 0 01.07-.084L12 5.432z" /></Icon>
);

export const InboxStackIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M3.375 4.5A2.25 2.25 0 015.625 2.25h12.75c1.243 0 2.25 1.007 2.25 2.25v3.83c-1.233-.73-2.65-1.162-4.125-1.162h-7.5c-1.475 0-2.892.432-4.125 1.162V4.5z" /><path fillRule="evenodd" d="M3 10.165v-.195c.98-.58 2.083-.935 3.25-1.022v.121a3 3 0 003 3h4.5a3 3 0 003-3v-.12c1.167.087 2.27.442 3.25 1.022v.195c0 1.243-1.007 2.25-2.25 2.25H5.25A2.25 2.25 0 013 10.165zM3.375 14.25a2.25 2.25 0 012.25-2.25h12.75a2.25 2.25 0 012.25 2.25v3.75a2.25 2.25 0 01-2.25-2.25H5.625a2.25 2.25 0 01-2.25-2.25v-3.75z" clipRule="evenodd" /></Icon>
);

export const UserCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" /></Icon>
);

export const Cog6ToothIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.543A6.001 6.001 0 005.812 6.643a1.85 1.85 0 00-2.43 1.094 6.001 6.001 0 00-1.094 2.43 1.85 1.85 0 00-1.543 1.85c0 .916.663 1.699 1.543 1.85a6.001 6.001 0 001.094 2.43 1.85 1.85 0 002.43 1.094 6.001 6.001 0 002.43 1.094 1.85 1.85 0 001.85 1.543c.916 0 1.699-.663 1.85-1.543a6.001 6.001 0 002.43-1.094 1.85 1.85 0 001.094-2.43 6.001 6.001 0 001.094-2.43 1.85 1.85 0 001.543-1.85c0-.916-.663-1.699-1.543-1.85a6.001 6.001 0 00-1.094-2.43 1.85 1.85 0 00-1.094-2.43 6.001 6.001 0 00-2.43-1.094A1.85 1.85 0 0011.078 2.25zM12 15a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></Icon>
);

export const ChatBubbleLeftRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path fillRule="evenodd" d="M1.5 2.625c0-.986.89-1.775 1.992-1.626a5.25 5.25 0 014.288 4.288C7.901 6.275 7.11 7.165 6.125 7.165H3.375A1.875 1.875 0 011.5 5.25v-2.625zM22.5 16.335c0 .986-.89 1.775-1.992 1.626a5.25 5.25 0 01-4.288-4.288c-.149-1.008.642-1.898 1.627-1.898h2.75a1.875 1.875 0 011.875 1.875v2.685zM12.75 1.5a.75.75 0 00-1.5 0v.503a5.23 5.23 0 014.73 4.73h.503a.75.75 0 000-1.5h-.43a3.73 3.73 0 00-3.3-3.3v-.43zM8.25 8.25A.75.75 0 009 7.5h.503a5.23 5.23 0 014.73 4.73v.503a.75.75 0 001.5 0v-.43a3.73 3.73 0 00-3.3-3.3h-.43a.75.75 0 00-.75.75z" clipRule="evenodd" /></Icon>
);

export const ArrowLeftOnRectangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 00-1.5 0v3.75a.75.75 0 01-.75.75h-4.5a.75.75 0 01-.75-.75V5.25a.75.75 0 01.75-.75h4.5a.75.75 0 01.75.75V9a.75.75 0 001.5 0V5.25a1.5 1.5 0 00-1.5-1.5h-6zM15.06 12L12 8.94a.75.75 0 011.06-1.06l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 11-1.06-1.06L15.06 12z" clipRule="evenodd" /></Icon>
);

export const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path fillRule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" clipRule="evenodd" /></Icon>
);

export const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M4.5 6.375a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zM4.5 10.125a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zM4.5 13.875a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75z" /><path fillRule="evenodd" d="M2.25 3A1.5 1.5 0 013.75 1.5h16.5A1.5 1.5 0 0121.75 3v18A1.5 1.5 0 0120.25 22.5H3.75A1.5 1.5 0 012.25 21V3zm1.5.75v16.5h15V3.75h-15z" clipRule="evenodd" /></Icon>
);

// FIX: Added the missing AcademicCapIcon.
export const AcademicCapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}>
        <path d="M11.723 3.322a1.5 1.5 0 01.554 0l7.5 3a1.5 1.5 0 010 2.656l-7.5 3a1.5 1.5 0 01-.554 0l-7.5-3a1.5 1.5 0 010-2.656l7.5-3z" />
        <path fillRule="evenodd" d="M3.322 8.018a.75.75 0 01.63.13l7.5 5.25a.75.75 0 00.996 0l7.5-5.25a.75.75 0 01.76.018.75.75 0 01.629 1.056l-7.5 10.5a.75.75 0 01-1.22-.001l-7.5-10.5a.75.75 0 01.63-.13z" clipRule="evenodd" />
    </Icon>
);

export const DocumentPlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path fillRule="evenodd" d="M12 3.75A2.25 2.25 0 009.75 6v1.5H6A2.25 2.25 0 003.75 9.75v7.5A2.25 2.25 0 006 19.5h12A2.25 2.25 0 0020.25 17.25v-7.5A2.25 2.25 0 0018 7.5h-3.75V6A2.25 2.25 0 0012 3.75zM12.75 7.5V6a.75.75 0 00-.75-.75h-.008a.75.75 0 00-.742.75v1.5h1.5z" clipRule="evenodd" /><path d="M5.25 9.75A.75.75 0 006 10.5h12a.75.75 0 000-1.5H6a.75.75 0 00-.75.75z" /></Icon>
);

// FIX: Added the missing ExclamationTriangleIcon.
export const ExclamationTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}>
        <path fillRule="evenodd" d="M10.868 2.854a.75.75 0 011.264 0l8.25 14.25a.75.75 0 01-.632 1.146H2.25a.75.75 0 01-.632-1.146l8.25-14.25zM12 15a.75.75 0 01-.75-.75V12a.75.75 0 011.5 0v2.25A.75.75 0 0112 15zm0-4.5a.75.75 0 00-.75.75v.008c0 .414.336.75.75.75s.75-.336.75-.75V11.25a.75.75 0 00-.75-.75z" clipRule="evenodd" />
    </Icon>
);

export const ClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 000-1.5h-3.75V6z" clipRule="evenodd" /></Icon>
);

export const ChartBarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></Icon>
);

export const FunnelIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M3.75 3.75A.75.75 0 003 4.5v3.199c0 .428.18.832.488 1.118l3.054 2.871-.16.037a.75.75 0 00-.58 1.054l1.52 3.801a.75.75 0 001.44-.241l1.52-3.801a.75.75 0 00-.58-1.054l-3.054-2.87-.16-.036a.75.75 0 00-.488-1.118V4.5A.75.75 0 003.75 3.75zM13.5 3.75a.75.75 0 01.75.75v9.099l3.47 3.251a.75.75 0 01-.98 1.132l-3.99-3.722a.75.75 0 01-.22-.53V4.5a.75.75 0 01.75-.75z" /></Icon>
);

export const MicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M12 18.75a6 6 0 006-6v-1.5a6 6 0 00-12 0v1.5a6 6 0 006 6zM10.5 5.25a.75.75 0 00-1.5 0v.161a8.25 8.25 0 00-1.523 6.342.75.75 0 001.49.162A6.75 6.75 0 0112 5.25a6.75 6.75 0 016.745 6.665.75.75 0 001.49-.162A8.25 8.25 0 0013.5 5.411V5.25a.75.75 0 00-1.5 0v.503a6.75 6.75 0 01-1.5-.503V5.25z" /></Icon>
);

export const StopCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.5 6a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zM13.5 8.25a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5z" clipRule="evenodd" /></Icon>
);

export const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.699a.75.75 0 01-.437-.695z" clipRule="evenodd" /></Icon>
);

export const CpuChipIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path fillRule="evenodd" d="M6 3a3 3 0 00-3 3v12a3 3 0 003 3h12a3 3 0 003-3V6a3 3 0 00-3-3H6zm1.5 1.5a.75.75 0 00-.75.75V6a.75.75 0 00.75.75h1.5a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75h-1.5zm3 0a.75.75 0 00-.75.75V6a.75.75 0 00.75.75h1.5a.75.75 0 00.75-.75V5.25a.75.75 0 00-.75-.75h-1.5zM9 9.75A.75.75 0 019.75 9h5.25a.75.75 0 010 1.5H9.75A.75.75 0 019 9.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clipRule="evenodd" /></Icon>
);

export const CalendarDaysIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 2.25a.75.75 0 01.75.75v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3h.75V3a.75.75 0 01.75-.75zM5.25 6.75c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h13.5c.621 0 1.125-.504 1.125-1.125V7.875c0-.621-.504-1.125-1.125-1.125H5.25z" clipRule="evenodd" /></Icon>
);

export const ChatBubbleBottomCenterTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.75 6.75 0 006.75-6.75V9.75a.75.75 0 011.5 0v5.25A8.25 8.25 0 016 23.25a8.22 8.22 0 01-1.196-.106l-4.135 3.308a.75.75 0 01-1.152-.648V16.5a.75.75 0 01.75-.75h.03a6.75 6.75 0 006.72-6.75V4.5a.75.75 0 011.5 0v4.5a8.25 8.25 0 01-8.25 8.25h-.03a.75.75 0 01-.75.75v5.454l3.08-2.464zM15 4.5a.75.75 0 01.75-.75h4.5a.75.75 0 010 1.5h-4.5a.75.75 0 01-.75-.75z" clipRule="evenodd" /></Icon>
);

export const PencilSquareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14.25a4.5 4.5 0 01-4.5 4.5H6.75a2.25 2.25 0 01-2.25-2.25V6.75a2.25 2.25 0 012.25-2.25h6.75a4.5 4.5 0 014.5 4.5v7.5z" /></Icon>
);

export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.542.923 1.27 1.811a49.03 49.03 0 01-2.928 6.55a.75.75 0 001.054 1.054c1.133-1.132 2.012-2.467 2.612-3.868.602-1.402.602-2.922 0-4.324a3.75 3.75 0 00-3.32-2.185C12.89.89 11.11.89 9.344 1.124a3.75 3.75 0 00-3.32 2.185c-.602 1.402-.602 2.922 0 4.324.6 1.401 1.479 2.736 2.612 3.868a.75.75 0 101.054-1.054a49.03 49.03 0 01-2.928-6.55c-.272-.888.303-1.758 1.27-1.811z" clipRule="evenodd" /></Icon>
);

export const ChevronUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path fillRule="evenodd" d="M11.47 7.72a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06L12 9.31l-6.97 6.97a.75.75 0 01-1.06-1.06l7.5-7.5z" clipRule="evenodd" /></Icon>
);

export const SpeakerWaveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.348 2.595.341 1.24 1.518 1.905 2.66 1.905H6.44l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06zM18.584 14.83a.75.75 0 000-1.06l-1.06-1.06a.75.75 0 00-1.06 0l-.62.62a.75.75 0 001.06 1.06l.62-.62 1.06 1.06a.75.75 0 001.06 0zM19.34 12c0-1.03-1.03-1.92-2.33-1.42a.75.75 0 00-.41 1.21 2.99 2.99 0 010 2.42.75.75 0 00.41 1.21c1.3-.5 2.33-.39 2.33-1.42z" /></Icon>
);

export const ArrowPathIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-4.5a.75.75 0 000 1.5h6a.75.75 0 00.75-.75v-6a.75.75 0 00-1.5 0v4.514l-1.636-1.637A9 9 0 103 12a.75.75 0 001.5 0 7.5 7.5 0 01.255-1.941z" clipRule="evenodd" /></Icon>
);

export const BellAlertIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path fillRule="evenodd" d="M12 2.25c-2.429 0-4.5 1.755-4.5 4.5v.255c-.95.24-1.809.59-2.618 1.052A9.738 9.738 0 002.25 12c0 2.868 1.22 5.457 3.22 7.282.995.922 2.203 1.543 3.53 1.874A.75.75 0 0010.5 21v-1.556c1.17.22 2.339.22 3.509 0V21a.75.75 0 001.5 0v-1.398a6.836 6.836 0 003.53-1.874C20.53 17.457 21.75 14.868 21.75 12a9.738 9.738 0 00-2.632-6.443 13.682 13.682 0 00-2.618-1.052V6.75c0-2.745-2.071-4.5-4.5-4.5zM15 6.75v.255a8.25 8.25 0 00-6 0V6.75c0-1.5.75-3 3-3s3 1.5 3 3z" clipRule="evenodd" /><path d="M13.5 10.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></Icon>
);

export const ChartPieIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v6.375a.75.75 0 00.75.75h6.375a.75.75 0 000-1.5H12.75V6z" clipRule="evenodd" /></Icon>
);

export const PaperClipIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path fillRule="evenodd" d="M12.963 2.286a.75.75 0 00-1.06 1.06L15.94 7.4l-5.72 5.72a.75.75 0 001.06 1.06l5.72-5.72 4.04 4.04a.75.75 0 001.06-1.06l-4.04-4.04 1.06-1.06a.75.75 0 00-1.06-1.06l-1.06 1.06L12.963 2.286z" clipRule="evenodd" /><path fillRule="evenodd" d="M8.328 8.482a3.75 3.75 0 00-5.304 5.304l7.5 7.5a.75.75 0 001.06-1.06l-7.5-7.5a2.25 2.25 0 013.182-3.182l5.25 5.25a.75.75 0 001.06-1.06l-5.25-5.25a3.75 3.75 0 00-5.304 0z" clipRule="evenodd" /></Icon>
);

export const CameraIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" /><path fillRule="evenodd" d="M9.344 3.071a.75.75 0 01.063.023l.112.064c.32.18.66.33.997.452a8.25 8.25 0 015.972 0 1.5 1.5 0 01.997-.452l.112-.064a.75.75 0 01.063-.023a49.255 49.255 0 015.312 0 .75.75 0 01.688.882c-.314 2.392-1.282 4.6-2.736 6.368a.75.75 0 01-1.08-.027l-.027-1.08c1.454-1.768 2.422-3.976 2.736-6.368a49.22 49.22 0 00-5.312 0 .75.75 0 01-.688-.882z" clipRule="evenodd" /></Icon>
);

export const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.06-1.06l-3.25 3.25-1.5-1.5a.75.75 0 00-1.06 1.06l2 2a.75.75 0 001.06 0l3.75-3.75z" clipRule="evenodd" /></Icon>
);

export const PrinterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <Icon {...props}><path fillRule="evenodd" d="M7.875 1.5C6.839 1.5 6 2.34 6 3.375v2.25c0 1.036.84 1.875 1.875 1.875h.375a3 3 0 013 3v1.5H6a.75.75 0 000 1.5h12a.75.75 0 000-1.5h-5.25v-1.5a3 3 0 013-3h.375C18.16 7.5 19 6.66 19 5.625v-2.25C19 2.34 18.16 1.5 17.125 1.5H7.875zM7.5 3.375c0-.207.168-.375.375-.375h9.25c.207 0 .375.168.375.375v2.25c0 .207-.168.375-.375.375h-9.25A.375.375 0 017.5 5.625v-2.25z" clipRule="evenodd" /><path d="M6 10.5a.75.75 0 01.75.75v3.75c0 .414.336.75.75.75h9a.75.75 0 00.75-.75v-3.75a.75.75 0 011.5 0v3.75a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-3.75A.75.75 0 016 10.5z" /><path d="M6 15.75a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H6.75a.75.75 0 01-.75-.75z" /></Icon>
);