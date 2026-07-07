document.addEventListener("DOMContentLoaded", () => {


    // MUSIC PLAYER

    const audio = document.getElementById("audioPlayer");
    const button = document.getElementById("playPauseBtn");


    if(audio && button){

        button.addEventListener("click", () => {


            if(audio.paused){

                audio.play();

                button.textContent = "❚❚";

            }

            else{

                audio.pause();

                button.textContent = "▶";

            }


        });


        audio.addEventListener("ended", () => {

            button.textContent = "▶";

        });

    }





    // TYPING EFFECT


    const links = document.querySelectorAll(".links a");


    links.forEach(link => {


        const text = link.querySelector("span");

        const original = text.textContent;


        let timer;



        link.addEventListener("mouseenter", () => {


            clearInterval(timer);


            let i = 0;


            timer = setInterval(() => {


                text.textContent = original.substring(0, i);


                i++;


                if(i > original.length){

                    clearInterval(timer);

                }


            },120);


        });




        link.addEventListener("mouseleave", () => {


            clearInterval(timer);


            text.textContent = original;


        });



    });



});