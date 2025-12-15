import * as React from "react";

interface StarLogoProps extends React.SVGProps<SVGSVGElement> {
    size?: number;
}

export function StarLogo({ size = 24, className, ...props }: StarLogoProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            {...props}
        >
            <path
                d="M256 48
           C280 160, 352 232, 464 256
           C352 280, 280 352, 256 464
           C232 352, 160 280, 48 256
           C160 232, 232 160, 256 48Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinejoin="round"
            />
        </svg>
    );
}
