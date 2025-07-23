import Image from "next/image";
import type { SVGProps } from "react";

export const Icons = {
  logo: (props: { className?: string }) => (
    <Image 
      src="/Logo.png" 
      alt="ArtChain AI Logo" 
      width={32} 
      height={32} 
      className={props.className}
    />
  ),
};
