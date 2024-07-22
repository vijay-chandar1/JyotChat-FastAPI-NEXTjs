import Image from "next/image";

export default function Header() {
  return (
    <div className="z-10 max-w-5xl w-full items-center justify-center mx-auto font-mono text-sm lg:flex">
      {/* <p className="left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
        Please type your query, &nbsp;
        <code className="font-mono font-bold">કૃપા કરીને તમારી ક્વેરી લખો</code>
      </p> */}
      <div className="flex items-center justify-center lg:static lg:h-auto lg:w-auto">
        <a
          href="https://www.jyot.in/"
          target="_blank"
          className="flex items-center justify-center font-nunito text-lg font-bold gap-2"
        >
          <span>JyotChat</span>
          <Image
            className="rounded-xl"
            src="/logo.png"
            alt="Jyot Logo"
            width={30}
            height={30}
            priority
          />
        </a>
      </div>
    </div>
  );
}
