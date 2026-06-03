
using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using UnityEngine.SceneManagement;

public class PlayerControll : MonoBehaviour {

	//A LOT OF VARIABLES ARE SET TO PUBLIC, BUT YOU CAN SET TO PRIVATE
	//I ONLY DID THIS SO I CAN SEE IN THE ENGINE


	//PHYSICS
	public Rigidbody2D				 PlayerRigidbody;
	public int 						forcejump;
	public Animator 				 anime;

	//Verifica se o player esta tocando no chao
	public Transform				 GroundCheck;
	public bool 					grounded;
	public LayerMask 				WhatIsGround;

	//GAMEOVER
	public static bool gameOver;

	//TOUCH
	public bool touch;
	public bool touchUp;
	public bool nottouch;



	//Pulo / JUMP
	public bool                      jump;
    //public bool gameoverEND;


	//Times

	public float 					jumpTempo;
	public float 					slideTempo;
	private float 					timeTempo;   //jump
	private float                    timeTempo2; //slide

	// VIDA / LIFE
	public int					  	    maxvida = 3;
	public static int 		     		quantvida;

	//MOEDAS / COINS NEVER USED
	public static int       moeda;



	//SWIPE
	private float fingerStartTime  = 0.0f;
	private Vector2 fingerStartPos = Vector2.zero;
	public bool isSwipe = false;
	private float minSwipeDist  = 50.0f;
	private float maxSwipeTime = 0.5f;

	//colisor do slide / COLISOR SLIDE
	public Transform                colisor;

	//Audio
	public AudioSource    audioFont;
	public AudioClip      soundJump;


	// Use this for initialization
	void Start () {

		gameOver = false;
		quantvida = 0;
        //gameoverEND = false;


    }
	
	// Update is called once per frame
	void Update () {


//---------------------------------------------------------------------------------------------------------------------------------
		//Here's I sumulate the touch
		if (Input.GetMouseButtonUp (0)) {
			touchUp = true;
			
		}

		if (Input.GetMouseButton (0)) {
			touch = true;
			touchUp = false;
			
		}

//-----------------------------------------------------------------------------------------------------------------------------



		

//--------------------------------------------------------------------------------------------------


		//Here the scrip create a circle and verify if the character is touching the ground, 0.2f is the size of the circle.
		// aqui ele cria um pequeno circulo e verifica se esta encostando no chao, 0.2f e o tamanho do circulo
		grounded = Physics2D.OverlapCircle (GroundCheck.position, 0.1f, WhatIsGround);
		
		
		//Makes the "Jump" from the Animatior be activate when the character is NOT touching the ground
		//faz com que o "jump" do animator seja ativado quando o personagem NAO estiver tocando no chao.
		
		anime.SetBool ("jump", !grounded);
		
		anime.SetBool ("gameover", gameOver);

//------------------------- MOUSE CONTROLLS ------------------------------------------------------------------------------------------------------------------

		// ** JUMP **--------------------------------
		if (Input.GetMouseButtonUp (0)) {
			if (grounded == true && jump == false) {

				//if the character is slide
				//se o personagem estiver fazendo slide
				
							
				//make the player jump
				//faz player pular.
				PlayerRigidbody.AddForce (new Vector2 (0, forcejump));

				//volume
				//volume
				audioFont.volume = 0.3f;
				//play the song
				//Toca o audio
				audioFont.PlayOneShot (soundJump);
				jump = true;
			}
			
		}

		//** SLIDE **-------------------------------------------------
		

//--------------------------------------------------------------------------------------------------------------------------------------------------


//----------------- TOUCH CONTROLLS---------------------------------------------------------------------------------------------------------------------------------
		//Here's the touch controll, slide and jump

		         //SLIDE AND JUMP
		if (Input.touchCount > 0 && jump == false){
			
			foreach (Touch touch in Input.touches){
				switch (touch.phase)
				{
				case TouchPhase.Began :
					/* this is a new touch */
					isSwipe = true;
					fingerStartTime = Time.time;
					fingerStartPos = touch.position;
					break;

				case TouchPhase.Canceled :
					/* The touch is being canceled */
					isSwipe = false;
					break;


				case TouchPhase.Ended :

				

					float gestureTime = Time.time - fingerStartTime;
					float gestureDist = (touch.position - fingerStartPos).magnitude;
					
					if (isSwipe && gestureTime < maxSwipeTime && gestureDist > minSwipeDist){
						Vector2 direction = touch.position - fingerStartPos;
						Vector2 swipeType = Vector2.zero;
						
						if (Mathf.Abs(direction.x) > Mathf.Abs(direction.y)){
							// the swipe is horizontal:
							swipeType = Vector2.right * Mathf.Sign(direction.x);
						}else{
							// the swipe is vertical:
							swipeType = Vector2.up * Mathf.Sign(direction.y);
						}

						// Swip left and right *****************************************************
						if(swipeType.x != 0.0f){
							if(swipeType.x > 0.0f){
								// MOVE RIGHT
								
								Debug.Log("right");
								
							}else{
								// MOVE LEFT
								Debug.Log("left");
								
							}
						}
						//******************************************************************************



					
						//swipe up and down *************************************
						if(swipeType.y != 0.0f ){
							if(swipeType.y > 0.0f){
								// MOVE UP
								Debug.Log("up");
								
							}else{
								//---------SLIDE-----------
								



							}
						}
						//***********************************************************
						//-----------------------




					}else {
						
						/////-----JUMP-----------------------------------------------------

						//if is on the ground
						//se estiver no chao
						if (grounded == true && jump == false){
							
							
							//if the character is slide
							//se o personagem estiver fazendo slide
							
							


							//make the player jump
							//faz player pular.
							PlayerRigidbody.AddForce(new Vector2(0, forcejump));

							//volume
							//volume
							audioFont.volume = 0.3f;
							//play the song
							//Toca o audio
							audioFont.PlayOneShot (soundJump);

							jump = true;
							
							
							
							
						}
							

					}
					//------------------

					break;
				}
			}

		}
		
		//-----------------------------------------------------------------------




		



//--------------------TEMPO DO JUMP / TIME JUMP ----------------------------------------------------------------------
		//This is necessary for fly, when certain time as passed its allows player for fly after jump, without this player whould flay
		// right away even if its not very high

		if (jump == true) {
			
			timeTempo += Time.deltaTime;

			if (timeTempo >= jumpTempo){
				
				if (grounded == true) {

					timeTempo = 0;
					jump = false;
					
				}
				
			}
			
		}
//--------------------------------------------------------------------------------------------------------------








//-------------------------------------------------------------------------------------------------------------------------------------


				

		   

//--------------BACKUP-----------------------BACKUP-----------------------BACKUP-----------------------BACKUP-----------------------BACKUP-----------------------BACKUP---------


		// ----------------JUMP---------------------------
		//se o botao for apertado
		//if (Input.GetButtonDown ("jump")) {

		/*

		if(Input.GetMouseButtonUp(0) && jump == false){
			
			// Se o mouse ou touch for apertado

			// se o mouse ou touch for "soltado"
			
			//if (Input.touchCount >0 && Input.GetTouch(0).phase == TouchPhase.Began) {
			
			//se o personagem encostar no chao
			if (grounded == true){

				//se o personagem estiver fazendo slide
				if (slide == true){
					
					
					//sobe o box de colisao do slide
					colisor.position = new Vector3 (colisor.position.x, colisor.position.y + 0.03f, colisor.position.z);
					
					//desliga o slide
					slide = false;
					
				}
				
				
				//faz player pular.
				
				
				PlayerRigidbody.AddForce(new Vector2(0, forcejump));
				
				jump = true;

			}

		}

		// -------------------------------------------------
		//Slide

		//if (Input.GetButtonDown ("slide") && grounded == true && slide == false) {
		/*if (Input.touchCount > 0 && Input.GetTouch(0).phase == TouchPhase.Moved && grounded == true && slide == false && jump == false) {

		
			//abaixa o box de colisao
			colisor.position = new Vector3 (colisor.position.x, colisor.position.y - 0.05f, colisor.position.z);

			slide = true;

		}


*/
//--------------BACKUP-----------------------BACKUP-----------------------BACKUP-----------------------BACKUP-----------------------BACKUP-----------------------BACKUP---------




	}
	
	

	//iff the character touch another collider 2d
	void OnTriggerEnter2D(Collider2D other){

        
		//iff the entity is with the tag "Object"
		if(other.gameObject.tag == "Object" )
		{
            
            gameOver = true;
            
            
           
            





        }
	

	
	}
    public void gameoverEND ()
    {
        SceneManager.LoadScene("Game Over");


    }







}