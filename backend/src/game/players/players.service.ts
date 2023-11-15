import { Injectable } from '@nestjs/common';
import { IPlayer } from '../Interface/player.interface';
import { Socket } from 'socket.io';

@Injectable()
export class PlayersService {

	private players: IPlayer[] = [];

	create(player: IPlayer) {
		this.players.push(player);
		console.log('Create Player');

	};

	remove(clientSocket: Socket) {
		this.players = this.players.filter((p) => {return p.socket != clientSocket;});
		console.log('Remove Player');
		console.log('Players:',this.players);
	};

	findAll(): IPlayer[] {
		return this.players;
	};

	findOne(socket: Socket): IPlayer | null {
		const player = this.players.find((element) => element.socket === socket);
		if (typeof(player) === 'undefined') {
			return null;
		}
		return player
	};

	/* changePlayerName(player:IPlayer, newName:string) {
		const index = this.players.indexOf(player);
		if (index != -1) {
			player.name = newName;
			
			this.players[index] = player;
		}
	}; */

	consoleLogPlayers() {
		console.log(this.players);
	}

	
}
