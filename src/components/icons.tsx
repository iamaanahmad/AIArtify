import Image from "next/image";

export const Icons = {
  logo: (props: { className?: string }) => (
    <Image 
      src="/Logo.png" 
      alt="AIArtify Logo" 
      width={32} 
      height={32} 
      className={props.className}
    />
  ),
};
