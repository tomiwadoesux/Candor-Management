import Image from "next/image";
import { models } from "../../data/models";

export default function Gridd() {
  return (
    <section className="w-full bg-white overflow-x-scroll h-auto px-[3rem]">
      <div
        className="flex gap-[3rem] h-full items-end"
        style={{ minWidth: "fit-content", width: "840px" }}
      >
        {models.map((model, index) => (
          <div
            key={model.id}
            className={`relative flex flex-shrink-0 flex-col ${
              index % 2 === 0 ? "self-start" : "self-end"
            }`}
            style={{ width: "450px" }}
          >
            {/* For self-end, render text first, image after. For self-start, image first, then text */}
            {index % 2 === 0 ? (
              <>
                <Image
                  src={model.coverImage}
                  alt={model.alt || model.name}
                  width={400}
                  height={600}
                  className="object-cover w-[100%] h-[100%]"
                />
                <div className="pt-1">
                  <h6 className="text-xs uppercase font-bold ">
                    {model.name}
                  </h6>
                  <p className="text-xs text-[#010101]/60 ">
                    {model.talent || "MODEL"}
                  </p>
                  <p className="text-xs text-[#010101]">{model.height}</p>
                </div>
              </>
            ) : (
              <>
                <div className="pb-1">
                  <h6 className="text-xs uppercase font-bold ">
                    {model.name}
                  </h6>
                  <p className="text-xs text-[#010101]/60">
                    {model.talent || "MODEL"}
                  </p>
                  <p className="text-xs text-[#010101]">{model.height}</p>
                </div>
                <Image
                  src={model.coverImage}
                  alt={model.alt || model.name}
                  width={400}
                  height={600}
                  className="object-cover w-[100%] h-[100%]"
                />
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
