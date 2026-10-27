"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { pad } from "./parts";

// The roster as one paragraph, with a layer of portraits behind it. The
// portraits are a sibling of the text, not inside it: the text is differenced
// against what lies under it to stay legible over a picture, and a portrait
// inside that blend would be inverted along with it.
export default function NamesList({ people, ...rest }) {
  const [active, setActive] = useState(-1);
  return (
    <div className="an-names-stage" {...rest}>
      <div className="an-names-faces" aria-hidden="true">
        {people.map(
          (m, i) =>
            m.face && (
              <span key={m.id} className={`an-name-img${i === active ? " is-on" : ""}`}>
                <Image src={m.face} alt="" fill sizes="(max-width: 1024px) 30vw, 18vw" />
              </span>
            )
        )}
      </div>
      <p
        className={`an-names-list an-l an-fade${active >= 0 ? " is-hovering" : ""}`}
        onMouseLeave={() => setActive(-1)}
      >
        {people.map((m, i) => (
          <span key={m.id}>
            <Link
              href={`/models/${m.id}`}
              className={`an-name${i === active ? " is-on" : ""}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(-1)}
            >
              {m.name}
              <sup className="an-name-n">{pad(i + 1)}</sup>
            </Link>
            {i < people.length - 1 && (
              <span className="an-name-sep" aria-hidden="true">
                {" / "}
              </span>
            )}
          </span>
        ))}
      </p>
    </div>
  );
}
