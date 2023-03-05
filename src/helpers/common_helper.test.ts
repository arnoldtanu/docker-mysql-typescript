import { capitalizeFirstLetter } from "./common_helper";

describe('Test Common Helper', () => {
  describe('Test Capitalize First Letter', () => {
    test('Capitalize first letter for FOOD', () => {
      expect(capitalizeFirstLetter('FOOD')).toEqual('Food');
      expect(capitalizeFirstLetter('food')).toEqual('Food');
      expect(capitalizeFirstLetter('fOoD')).toEqual('Food');
      expect(capitalizeFirstLetter('****')).toEqual('****');
    });
  });
});