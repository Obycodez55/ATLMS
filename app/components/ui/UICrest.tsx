import Image from "next/image";

interface UICrestProps {
  className?: string;
}

export default function UICrest({ className }: UICrestProps) {
  return (
    <Image
      src="/ui-crest.png"
      alt="University of Ibadan crest"
      width={60}
      height={60}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
