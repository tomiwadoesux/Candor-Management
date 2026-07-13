'use client';

import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';

export default function InvitationCard() {
	const buttonRef = useRef(null);
	const envelopeRef = useRef(null);
	const flapRef = useRef(null);
	const cardRef = useRef(null);
	const maskRef = useRef(null);

	const [isOpen, setIsOpen] = useState(false);
	const [flipped, setFlipped] = useState(false);
	const [buttonText, setButtonText] = useState("You're Invited!");

	const fp = 'https://s3-us-west-2.amazonaws.com/s.cdpn.io/39132/';

	useEffect(() => {
		const button = buttonRef.current;
		if (!button) return;

		// First click only - pull out animation
		const handleFirstClick = () => {
			pullOut();
			// After first click, remove this listener and add the toggle listener
			button.removeEventListener('click', handleFirstClick);
			button.addEventListener('click', toggleFlip);
		};

		button.addEventListener('click', handleFirstClick);

		return () => {
			button.removeEventListener('click', handleFirstClick);
		};
	}, []);

	const pullOut = () => {
		const tl = gsap.timeline();

		tl.to(flapRef.current, {
			rotationX: 180,
			duration: 1,
			ease: 'power1.inOut',
		}, 'scaleBack')
			.to('.invitation', {
				scale: 0.8,
				duration: 1,
				ease: 'power4.inOut',
			}, 'scaleBack')
			.set(flapRef.current, {
				zIndex: 0,
			})
			.set(maskRef.current, {
				zIndex: 100,
				overflow: 'visible',
			})
			.to(cardRef.current, {
				y: '0%',
				scaleY: 1.2,
				duration: 1,
				ease: 'circ.inOut',
			})
			// Card moves right, envelope moves left
			.to(maskRef.current, {
				x: '250px',
				duration: 1.5,
				ease: 'power2.inOut',
				onStart: () => {
					// Remove clip-path as card separates
					if (maskRef.current) {
						maskRef.current.style.clipPath = 'unset';
						maskRef.current.style.overflow = 'visible';
					}
				},
			}, 'separate')
			.to(envelopeRef.current, {
				x: '-250px',
				duration: 1.5,
				ease: 'power2.inOut',
				onComplete: () => {
					setIsOpen(true);
					envelopeRef.current?.classList.toggle('is-open');
				},
			}, 'separate')
			// Card continues pulling down
			.to(cardRef.current, {
				y: '100%',
				scaleY: 1,
				duration: 1.3,
				ease: 'circ.inOut',
			}, 'moveDown')
			.to(buttonRef.current, {
				y: '180px',
				duration: 1,
				ease: 'circ.inOut',
				onComplete: toggleText,
			}, 'moveDown+=0.15');
	};

	const toggleFlip = () => {
		if (!isOpen) return;

		const ry = !flipped ? 180 : 0;
		setFlipped(!flipped);

		gsap.to(cardRef.current, {
			rotationY: ry,
			duration: 1,
			ease: 'power4.inOut',
			onComplete: toggleText,
		});
	};

	const toggleText = () => {
		const newFlipped = !flipped;
		setFlipped(newFlipped);
		setButtonText(newFlipped ? 'Tell me more!' : 'See you there!');
	};

	return (
		<div className="flex items-center justify-center h-screen bg-gradient-to-b from-[#f5f5f5] to-[#b0b0b0] [perspective:1000px] select-none overflow-hidden">
			<style jsx>{`
				.invitation {
					width: 500px;
					position: absolute;
					top: 50%;
					left: 50%;
					transform: translate(-50%, -50%);
				}

				.envelope {
					background: #1a1a1a;
					width: 100%;
					height: 307.7px;
					position: relative;
					z-index: 1;
					transition: z-index 0.3s ease;
				}

				.envelope.is-open {
					z-index: -1;
				}

				.envelope.is-open:before,
				.envelope.is-open:after {
					z-index: -2;
				}

				.envelope:before,
				.envelope:after {
					content: "";
					position: absolute;
					bottom: 0;
				}

				.envelope:before {
					right: 0;
					border-bottom: 0px solid transparent;
					border-top: 307.7px solid transparent;
					border-right: 500px solid #0d0d0d;
					z-index: 1;
				}

				.envelope:after {
					left: 0;
					border-bottom: 0px solid transparent;
					border-top: 307.7px solid transparent;
					border-left: 500px solid #262626;
					z-index: 1;
				}

				.flap {
					border-right: 250px solid transparent;
					border-top: 153.85px solid #000;
					border-left: 250px solid transparent;
					position: absolute;
					left: 0;
					top: 0;
					transform-origin: 50% 0%;
					z-index: 2;
					transform-style: preserve-3d;
					transition: z-index 0.3s ease;
				}

				.envelope.is-open .flap {
					z-index: -1;
				}

				.mask {
					box-sizing: border-box;
					clip-path: inset(0 0 50% 0);
					overflow: hidden;
					position: relative;
					width: 480px;
					height: 1344.4px;
					z-index: 100;
					margin: auto;
					top: 50%;
					transform: translate(0, -50%);
				}

				.envelope.is-open .mask {
					z-index: 100;
					clip-path: unset;
				}

				.card {
					position: relative;
					width: 480px;
					height: 670px;
					margin: auto;
					transform-style: preserve-3d;
					transform-origin: 50% 10%;
					transform: translate(0, 128%) rotateY(0deg);
				}

				.face {
					top: 0;
					right: 0;
					bottom: 0;
					left: 0;
					position: absolute;
					background: transparent 50% 100% / auto 100% no-repeat;
					box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
				}

				.face.back {
					transform: translateZ(-3px) rotateY(180deg);
					background-size: 130% auto;
				}

				.front {
					background-image: url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/39132/poke-bg.gif);
				}

				.face.back {
					background-image: url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/39132/poke-bg.jpg);
					color: #000;
					overflow: hidden;
				}

				.front h1 {
					position: relative;
					font: normal 3em/0.9 'Slackey', sans-serif;
					letter-spacing: -2px;
					color: #ffce00;
					padding: 30px 0 0;
					margin: 0;
					-webkit-font-smoothing: subpixel-antialiased;
				}

				.front h1 img {
					width: 90%;
					display: block;
					margin: auto;
				}

				.front h1 span {
					display: block;
					text-align: center;
					margin-top: 40px;
					padding: 0 20%;
					line-height: 1.3;
				}

				.front h1 .extrude {
					text-shadow:
						0 1px 0 #ffd700,
						0 2px 0 #ffcc00,
						0 3px 0 #ffb800,
						0 4px 0 #ffa500,
						0 5px 0 #ff8c00,
						0 6px 1px rgba(0, 0, 0, 0.0980392),
						0 0 5px rgba(0, 0, 0, 0.0980392),
						0 1px 3px rgba(0, 0, 0, 0.298039),
						0 3px 5px rgba(0, 0, 0, 0.2),
						0 5px 10px rgba(0, 0, 0, 0.247059);
				}

				.back img {
					position: absolute;
					top: 60px;
					display: inline-block;
					width: 90%;
					left: 50%;
					transform: translate(-50%, 0);
				}

				button {
					font: normal 1.25em 'Karla', sans-serif;
					padding: 15px 30px;
					border-radius: 30px;
					background: #ffce00;
					color: #ff3c41;
					border: none;
					position: absolute;
					box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
					left: 50%;
					top: 170px;
					transform: translateX(-50%);
					transform-origin: 50% 50%;
					z-index: 1;
					cursor: pointer;
					transition: background 0.3s ease-out, color 0.3s ease-out;
				}

				button.invert {
					color: #ffce00;
					background: #cc1a1f;
				}

				@media (min-width: 400px) and (max-width: 1023px) {
					.invitation {
						transform: translate(-50%, -50%) scale(0.5);
					}
				}
			`}</style>

			<div className="invitation" ref={envelopeRef}>
				<div className="envelope" ref={envelopeRef}>
					<div className="mask" ref={maskRef}>
						<div
							className="card"
							ref={cardRef}
							style={{ transformStyle: 'preserve-3d' }}
						>
							{/* Front */}
							<div className="face front">
								<h1>
									<img src={`${fp}poke-logo.svg`} alt="Pokemon Logo" />
									<span className="extrude">Invitation Card</span>
								</h1>
							</div>

							{/* Back */}
							<div className="face back">
								<img src={`${fp}poke-peeps.png`} alt="Pokemon Characters" />
							</div>
						</div>
					</div>
				</div>

				<div className="flap" ref={flapRef}></div>

				<button
					ref={buttonRef}
					className={flipped ? 'invert' : ''}
				>
					{buttonText}
				</button>
			</div>
		</div>
	);
}
