import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Assignee {
  @Field(() => Int)
  id: number;

  @Field()
  name: string;
}
