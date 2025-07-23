import Image from "next/image";

export const Icons = {
  logo: (props: { className?: string }) => (
    <Image 
      src="https://i.ibb.co/93dZ5qdH/Art-Chain-AILogo.png" 
      alt="AIArtify Logo" 
      width={32} 
      height={32} 
      className={props.className}
    />
  ),
};
